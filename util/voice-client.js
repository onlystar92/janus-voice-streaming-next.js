import User from "./user"
import VideoRoom from "./video-room"

function notInList(list) {
	return item => list.indexOf(item) === -1
}

class VoiceClient {
	constructor(token, room) {
		this.token = token
		this.room = room
		this.user = new User(token)
		this.listening = []
	}

	async connect() {
		console.info("Connecting client to janus...")
		await this.user.getClient().connect()
	}

	async publishUserMedia(room) {
		if (!this.hasSession()) {
			throw new Error("The client needs to be connected before publishing media")
		}

		console.info("Publishing feed...")
		const videoRoom = await this.getVideoRoom(room)
		const feed = await videoRoom.publishFeed(this.token)

		if (!feed) {
			console.error(`Failed to publish feed to room ${room}`)
			return
		}

		this.publisherSession = { id: feed.response.id, connection: feed.connection }
	}

	async listenToFeeds(room) {
		const feeds = await this.getFeeds(room)
		const publisherId = this.publisherSession.id
		const listening = publisherId ? [publisherId, ...this.listening] : this.listening
		const notListening = notInList(listening)

		// Listen to new feeds in room not being listened to
		feeds.filter(notListening).forEach(feed => this.listenToFeed(room, feed))

		// Recursively call every second
		setTimeout(() => this.listenToFeeds(room), 2000)
	}

	async listenToFeed(room, feed) {
		if (!this.hasSession()) {
			throw new Error("The client needs to be connected before subscribing to publishers")
		}

		const videoRoom = await this.getVideoRoom(room)
		const feedHandler = await videoRoom.listenFeed(feed, this.onTrack)

		feedHandler.onConnected(() => {
			console.info("Peer connected")
			this.listening.push(feed)
		})

		feedHandler.onDisconnect(() => {
			console.info("Peer disconnected")
		})

		feedHandler.onClosed(() => {
			console.info("Connection closed")
			this.listening = this.listening.filter(listening => listening !== feed)
		})
	}

	async getVideoRoom(room) {
		if (!this.hasSession()) {
			throw new Error("The client needs to be connected before retreiving a room")
		}

		return new VideoRoom(this.user.getSession(), room)
	}

	async getFeeds(room) {
		return await this.user.getSession().videoRoom().getFeeds(room)
	}

	hasSession() {
		return this.user.getSession() !== null
	}

	onConnectSuccess(callback) {
		this.user.getClient().onConnectSuccess(callback)
	}

	onStreamReceived(callback) {
		this.onTrack = callback
	}
}

export default VoiceClient
