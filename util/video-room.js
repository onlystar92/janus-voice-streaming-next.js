import { userStore } from "stores/User"
import { createPeerConnection } from "./connection"
import * as R from "ramda"
import { autorun } from "mobx"

const DEFAULT_CONSTRAINTS = { audio: true, video: false }

function getUserMediaStream(constraints) {
	return navigator.mediaDevices.getUserMedia(constraints)
}

async function enumerateMediaDevices() {
	return await navigator.mediaDevices.enumerateDevices()
}

async function findDeviceIdByName(name) {
	const devices = await enumerateMediaDevices()
	return devices.find(device => device.label === name)
}

function wrapVideoRoom(client, room) {
	return { token: client.token, session: client.getSession(), room }
}

function handleIceCandidate(handle, peerConnection) {
	return async function (event) {
		if (!event.candidate) {
			console.info("No event candidate")
			return
		}

		const candidate = event.candidate
		console.info("Got ice candidate:", candidate)
		peerConnection.addIceCandidate(candidate)

		console.info("Trickling candidate")
		await handle.trickle(candidate)
	}
}

async function publishAudioTracks(videoRoom, constraints = DEFAULT_CONSTRAINTS) {
	const { session, token, room } = videoRoom
	const roomHandle = await session.videoRoom().defaultHandle()
	const peerConnection = createPeerConnection()

	// Attach audio
	const stream = await getUserMediaStream(constraints)
	const audioTrack = stream.getAudioTracks()[0]
	const trackSender = peerConnection.addTrack(audioTrack, stream)

	const disposeInputHandler = autorun(async () => {
		const preferredInput = userStore.settings.preferredInput
		console.info("Changing input device to:", userStore.settings.preferredInput)

		let device = await findDeviceIdByName(preferredInput)

		if (!device || !device.deviceId) {
			return
		}

		getUserMediaStream({ audio: { deviceId: device.deviceId } })
			.then(newStream => {
				const audioTrack = newStream.getAudioTracks()[0]
				trackSender.replaceTrack(audioTrack)
				console.info("Changed input device to:", audioTrack)
			})
			.catch(error => {
				console.error(`Failed to get media stream from device '${preferredInput}':`, error)
			})
	})

	const disposeMuteHandler = autorun(() => {
		console.info("Muted:", userStore.settings.muted)
		trackSender.track.enabled = !userStore.settings.muted
	})

	// Create offer
	const offer = await peerConnection.createOffer()
	await peerConnection.setLocalDescription(offer)

	// Publish audio stream
	const feedConfiguration = {
		room,
		token,
		display: userStore.username,
		jsep: peerConnection.localDescription,
		audio: true,
		video: false,
	}
	const { id, jsep } = await roomHandle.publishFeed(feedConfiguration)

	// Set received answer
	const answer = new RTCSessionDescription(jsep)
	await peerConnection.setRemoteDescription(answer)

	// Handle connection state
	let onConnect, onDisconnect, onClose
	peerConnection.onconnectionstatechange = function (event) {
		switch (peerConnection.connectionState) {
			case "connected":
				onConnect(event)
				break
			case "disconnected":
			case "failed":
				onDisconnect(event)
				break
			case "closed":
				onClose(event)
				disposeMuteHandler()
				disposeInputHandler()
				break
		}
	}

	// Handle ice candidates
	peerConnection.onicecandidate = handleIceCandidate(roomHandle, peerConnection)

	return {
		id,
		onConnect(callback) {
			onConnect = callback
		},
		onDisconnect(callback) {
			onDisconnect = callback
		},
		onClose(callback) {
			onClose = callback
		},
	}
}

async function listenFeed(videoRoom, feed, onTrack) {
	const { session, room } = videoRoom
	const listenHandle = await session.videoRoom().listenFeed(room, feed)
	const peerConnection = createPeerConnection()

	// Set the remote offer
	const offer = new RTCSessionDescription({ type: "offer", sdp: listenHandle.getOffer() })
	peerConnection.setRemoteDescription(offer)

	// Handle connection state
	let onConnect, onDisconnect, onClose, onTrackReceive
	peerConnection.onconnectionstatechange = async function (event) {
		switch (peerConnection.connectionState) {
			case "connected":
				await onConnect(event)
				break
			case "disconnected":
			case "failed":
				await onDisconnect(event)
				break
			case "closed":
				await onClose(event)
				break
		}
	}

	// Handle track event
	peerConnection.ontrack = async function (event) {
		await onTrack(event)
	}

	// Handle ice candidates
	peerConnection.onicecandidate = handleIceCandidate(listenHandle, peerConnection)

	// Create answer
	const answer = await peerConnection.createAnswer()
	await peerConnection.setLocalDescription(answer)

	// Send answer
	await listenHandle.setRemoteAnswer(answer.sdp)

	return {
		onConnect(callback) {
			onConnect = callback
		},
		onDisconnect(callback) {
			onDisconnect = callback
		},
		onClose(callback) {
			onClose = callback
		},
	}
}

function getFeeds(videoRoom) {
	const { session, room } = videoRoom
	return session.videoRoom().getFeeds(room)
}

async function getFeedsExcept(videoRoom, feed) {
	const feeds = await getFeeds(videoRoom)
	return R.filter(R.complement(R.equals(R.__, feed)), feeds)
}

async function listParticipants(videoRoom) {
	const { session, room } = videoRoom
	const handle = await session.videoRoom().defaultHandle()
	return handle.listParticipants({ room })
}

export { wrapVideoRoom, publishAudioTracks, listenFeed, getFeeds, getFeedsExcept, listParticipants }
