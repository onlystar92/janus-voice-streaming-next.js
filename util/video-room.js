import { PublisherConnection, ListenerConnection } from "./connection"

class VideoRoom {
	constructor(session, room) {
		this.session = session
		this.room = room
	}

	async publishFeed(token) {
		const roomHandle = await this.session.videoRoom().defaultHandle()
		const peerConnection = new PublisherConnection(roomHandle)

		// Add media tracks
		await peerConnection.addMediaTracks()

		// Create offer
		const offer = await peerConnection.createOffer()
		await peerConnection.setLocalDescription(offer)

		// Publish media feed
		const publishResponse = await peerConnection.publishMediaFeed(this.room, token)

		// Parse answer
		const answer = new RTCSessionDescription(publishResponse.jsep)
		await peerConnection.setRemoteDescription(answer)

		// Register event handlers
		peerConnection.registerEventHandlers()

		return { connection: peerConnection, response: publishResponse }
	}

	async listenFeed(feed, onTrack) {
		const listenHandle = await this.session.videoRoom().listenFeed(this.room, feed)
		const offer = listenHandle.getOffer()
		const peerConnection = new ListenerConnection(listenHandle, offer)

		// Add on event listeners
		let onPeerConnected, onPeerDisconnect, onPeerConnectionClose
		peerConnection.onconnectionstatechange = function (event) {
			switch (peerConnection.connectionState) {
				case "connected":
					onPeerConnected(event)
					break
				case "disconnected":
				case "failed":
					onPeerDisconnect(event)
					break
				case "closed":
					onPeerConnectionClose(event)
					break
			}
		}
		peerConnection.ontrack = onTrack

		// Create answer
		const answer = await peerConnection.createAnswer()
		await peerConnection.setLocalDescription(answer)

		// Send answer
		await listenHandle.setRemoteAnswer(answer.sdp)

		function onConnected(callback) {
			onPeerConnected = callback
		}

		function onDisconnect(callback) {
			onPeerDisconnect = callback
		}

		function onClosed(callback) {
			onPeerConnectionClose = callback
		}

		return { onConnected, onDisconnect, onClosed }
	}

	configureRoom(options) {
		return this.handle.configure(options)
	}
}

export default VideoRoom
