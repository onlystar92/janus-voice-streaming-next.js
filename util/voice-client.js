import * as R from "ramda"
import clientStore, { Client } from "stores/ClientStore"
import { userStore } from "stores/User"
import { executeIfPresent } from "./callback"
import { publishAudioTracks, listenFeed, getFeedsExcept, listParticipants } from "./video-room"

function publishClientMedia(room) {
	return new Promise(async (resolve, reject) => {
		const { id, onConnect, onDisconnect } = await publishAudioTracks(room)

		// Handle connect
		onConnect(() => {
			console.info("Assigned publisher id:", id)
			userStore.session.setPublisherId(id)

			// Add client
			const client = new Client(id, userStore.username)
			clientStore.addClient(client)
			resolve()
		})

		// Handle client disconnect
		onDisconnect(() => {
			userStore.session.setPublisherId(null)

			// Remove client
			if (clientStore.contains(id)) {
				const client = clientStore.getClient(id)
				clientStore.removeClient(client)
			}

			// Reject promise
			reject()
		})
	})
}

async function listenToNewFeeds(
	room,
	onClientConnected,
	onClientDisconnected,
	onConnectionClose,
	onStreamReceived,
) {
	const feeds = await getFeedsExcept(room, userStore.session.publisherId)

	// Listen to all new feeds
	feeds
		.filter(feed => R.not(clientStore.contains(feed)))
		.forEach(async feed => {
			console.info("Listening to new feed:", feed)
			await listenToFeed(
				room,
				feed,
				onClientConnected,
				onClientDisconnected,
				onConnectionClose,
				onStreamReceived,
			)
		})

	// Recursively call method after 5s
	setTimeout(
		() =>
			listenToNewFeeds(
				room,
				onClientConnected,
				onClientDisconnected,
				onConnectionClose,
				onStreamReceived,
			),
		5000,
	)
}

async function listenToFeed(
	room,
	feed,
	onClientConnected,
	onClientDisconnected,
	onConnectionClose,
	onStreamReceived,
) {
	const streamHandler = event => onStreamReceived(feed, event)
	const listenHandle = await listenFeed(room, feed, streamHandler)

	listenHandle.onConnect(async event => {
		console.info("Finding feed", feed, "in room")
		const listResponse = await listParticipants(room)
		const participant = listResponse.participants.find(R.propEq("id", feed))

		// Add client
		const client = new Client(participant.id, participant.display)
		clientStore.addClient(client)

		// Execute callback
		await executeIfPresent(onClientConnected, [feed, event])
	})

	listenHandle.onDisconnect(async event => {
		const client = clientStore.getClient(feed)
		clientStore.removeClient(client)

		await executeIfPresent(onClientDisconnected, [feed, event])
	})

	listenHandle.onClose(async event => {
		console.info("Connection closed")
		await executeIfPresent(onConnectionClose, [feed, event])
	})
}

export { publishClientMedia, listenToFeed, listenToNewFeeds }
