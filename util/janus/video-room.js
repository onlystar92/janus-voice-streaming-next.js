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

function average(values) {
	var sumValues = values.reduce(function (sum, value) {
		return sum + value
	}, 0)

	return sumValues / values.length
}

function msToTime(duration) {
	var seconds = Math.floor((duration / 1000) % 60),
		minutes = Math.floor((duration / (1000 * 60)) % 60),
		hours = Math.floor((duration / (1000 * 60 * 60)) % 24)

	hours = hours < 10 ? "0" + hours : hours
	minutes = minutes < 10 ? "0" + minutes : minutes
	seconds = seconds < 10 ? "0" + seconds : seconds

	return hours + ":" + minutes + ":" + seconds
}

function showPeerConnectionStatus(connection) {
	var start = Date.now()

	window.setInterval(function () {
		let rttMeasures = []
		var sender = connection.getSenders()[0]

		// Show Duration
		var delta = Date.now() - start // milliseconds elapsed since start
		document.getElementById("duration").innerText = msToTime(delta)

		sender.getStats(null).then(stats => {
			stats.forEach(report => {
				if (report.type === "remote-inbound-rtp") {
					rttMeasures.push(report["roundTripTime"])
					var avgRtt = average(rttMeasures)

					var emodel = 0
					if (avgRtt / 2 >= 0.5) emodel = 1
					else if (avgRtt / 2 >= 0.4) emodel = 2
					else if (avgRtt / 2 >= 0.3) emodel = 3
					else if (avgRtt / 2 >= 0.2) emodel = 4
					else if (avgRtt / 2 < 0.2) emodel = 5

					// Draw Network Quality Bar
					const elements = document.querySelectorAll("#networkQuality > div")
					elements.forEach((el, key) => {
						if (emodel - 1 >= key) {
							el.classList.remove("bg-gray-600")
							el.classList.add("bg-gray-300")
						} else {
							el.classList.remove("bg-gray-300")
							el.classList.add("bg-gray-600")
						}
					})
				}
			})
		})
	}, 1000)
}

async function publishAudioTracks(room, constraints = DEFAULT_CONSTRAINTS) {
	const { token, session } = userStore

	// Get audio track
	const stream = await getUserMediaStream(constraints)
	const audioTrack = stream.getAudioTracks()[0]

	// Create peer connection with audio tracks
	const peerConnection = createPeerConnection()
	const trackSender = peerConnection.addTrack(audioTrack, stream)

	// Show Connection Status
	showPeerConnectionStatus(peerConnection)

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
		peerConnection,
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
