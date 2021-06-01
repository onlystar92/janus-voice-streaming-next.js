import userStore from "stores/User"
import { createPeerConnection } from "../connection"
import * as R from "ramda"

const DEFAULT_CONSTRAINTS = { audio: true, video: false }

function getUserMediaStream(constraints) {
	return navigator.mediaDevices.getUserMedia(constraints)
}

function getFeeds(videoRoom) {
	const { session, room } = videoRoom
	return session.videoRoom().getFeeds(room)
}

async function getFeedsExcept(videoRoom, feed) {
	const feeds = await getFeeds(videoRoom)
	return R.filter(R.complement(R.equals(R.__, feed)), feeds)
}

async function listParticipants(room) {
	const session = userStore.session
	const handle = await session.videoRoom().defaultHandle()
	return handle.listParticipants({ room })
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

		console.info("Trkcling ice candidate")
		handle.trickle(candidate)
	}
}

async function publishAudioTracks(room, constraints = DEFAULT_CONSTRAINTS) {
	const { token, session } = userStore

	// Get audio track
	const stream = await getUserMediaStream(constraints)
	const audioTrack = stream.getAudioTracks()[0]

	// Create peer connection with audio tracks
	const peerConnection = createPeerConnection()
	const trackSender = peerConnection.addTrack(audioTrack, stream)

	// Create offer
	const offer = await peerConnection.createOffer()
	await peerConnection.setLocalDescription(offer)

	// Publish audio stream
	const roomHandle = await session.videoRoom().defaultHandle()
	const { id, jsep } = await roomHandle.publishFeed({
		room,
		token,
		display: userStore.uuid,
		jsep: peerConnection.localDescription,
		audio: true,
		video: false,
	})

	// Set received answer
	const answer = new RTCSessionDescription(jsep)
	await peerConnection.setRemoteDescription(answer)

	// Handle ice candidates
	peerConnection.onicecandidate = handleIceCandidate(roomHandle, peerConnection)

	return {
		id,
		peerConnection,
		trackSender,
	}
}

async function listenFeed(room, feed, onTrack) {
	const session = userStore.session
	const listenHandle = await session.videoRoom().listenFeed(room, feed)
	const peerConnection = createPeerConnection()

	// Set the remote offer
	const offer = new RTCSessionDescription({ type: "offer", sdp: listenHandle.getOffer() })
	peerConnection.setRemoteDescription(offer)

	// Handle connection state
	let onConnect, onDisconnect, onClose
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
	peerConnection.ontrack = onTrack

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

export { publishAudioTracks, listenFeed, getFeeds, getFeedsExcept, listParticipants }
