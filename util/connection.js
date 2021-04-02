const DEFAULT_CONFIGURATON = {
	iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
}

const DEFAULT_CONSTRAINTS = { audio: true, video: false }

function getUserMediaStream(constraints) {
	return navigator.mediaDevices.getUserMedia(constraints)
}

function createPeerConnection(configuration = DEFAULT_CONFIGURATON) {
	return new RTCPeerConnection(configuration)
}

function ListenerConnection(handle, offer) {
	const peerConnection = createPeerConnection()

	// Set the remote peer's current offer
	peerConnection.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp: offer }))

	// Add ice candidate event handler
	peerConnection.onicecandidate = async function (event) {
		if (!event.candidate) {
			console.info("No event candidate for feed")
			return
		}

		const candidate = event.candidate
		console.info("Got candidate:", candidate)
		peerConnection.addIceCandidate(candidate)

		console.info("Trickling ice candidate from feed")
		await handle.trickle(candidate)
	}

	return peerConnection
}

function PublisherConnection(handle) {
	const peerConnection = createPeerConnection()

	RTCPeerConnection.prototype.publishMediaFeed = async (room, token) => {
		return await handle.publishFeed({
			room: room,
			jsep: peerConnection.localDescription,
			audio: true,
			video: false,
			token,
		})
	}

	RTCPeerConnection.prototype.addMediaTracks = async (constraints = DEFAULT_CONSTRAINTS) => {
		const mediaStream = await getUserMediaStream(constraints)
		mediaStream.getTracks().forEach(track => peerConnection.addTrack(track, mediaStream))
	}

	RTCPeerConnection.prototype.registerEventHandlers = () => {
		// Add ice candidate event handler
		peerConnection.onicecandidate = async event => {
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

	return peerConnection
}

export { PublisherConnection, ListenerConnection }
