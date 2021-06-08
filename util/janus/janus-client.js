import { Janus as JanusClient } from "janus-videoroom-client"
import { autorun } from "mobx"
import userStore from "stores/User"
import createSwitchboardClient from "util/switchboard/switchboard-client"
import { publishClientMedia, listenToFeed } from "util/voice-client"
import { listParticipants } from "./video-room"

function assignSession(session) {
	console.info("Assigning client session")
	userStore.setSession(session)
}

function notListeningTo(participant) {
	return (
		userStore.pendingListen.indexOf(participant.display) !== -1 &&
		userStore.listening.indexOf(participant.display) === -1
	)
}

async function listenToParticipant(room, participant) {
	console.info(`Listening to participant ${participant.display}`)
	await listenToFeed(room, participant.id)
	userStore.removeUserFromPending(participant.display)
	userStore.addUserToListening(participant.display)
}

async function listenToNewClients(room) {
	const response = await listParticipants(room)

	console.info("Participants:", response.participants)
	response.participants
		.filter(notListeningTo)
		.forEach(participant => listenToParticipant(room, participant))

	return setTimeout(async () => await listenToNewClients(room), 2000)
}

let disposeRoomHandler
let clientListener
let mediaPublisher
let previousRoom

const handleConnect = client => () => {
	console.info("Creating client session")
	client.createSession().then(assignSession).then(createSwitchboardClient).catch(handleError)

	console.info("Starting room handler")
	disposeRoomHandler = autorun(async () => {
		const room = userStore.room

		if (!room) {
			console.info("Ignoring room update. No room assigned yet!")
			return
		}

		if (room === previousRoom) {
			console.info("Ignoring room update. Room is same as previous!")
			return
		}

		if (mediaPublisher) {
			await mediaPublisher.close()
		}

		if (clientListener) {
			clearTimeout(clientListener)
		}

		console.info("Publishing media to room:", room)
		mediaPublisher = await publishClientMedia(room)
		clientListener = await listenToNewClients(room)

		console.info("Storing previous room")
		previousRoom = room
	})
}

function handleDisconnected() {
	console.info("Client disconnected")
	console.info("Removing client session")
	userStore.setSession(null)

	console.info("Disposing room handler")
	if (disposeRoomHandler) disposeRoomHandler()

	console.info("Stopping media publisher")
	if (mediaPublisher) mediaPublisher.close()
	if (clientListener) clearTimeout(clientListener)
}

function handleError(error) {
	console.info("An error ocurred:", error)
}

function handleEvent(event) {
	console.info("Event occurred:", event)
}

export default function createJanusClient(token) {
	const client = new JanusClient({ url: "wss://api.godcomplex.org/janus", reconnect: true, token })
	client.onConnected(handleConnect(client))
	client.onDisconnected(handleDisconnected)
	client.onError(handleError)
	client.onEvent(handleEvent)

	return client
}
