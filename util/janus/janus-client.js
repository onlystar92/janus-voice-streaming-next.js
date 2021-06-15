import { Janus as JanusClient } from "janus-videoroom-client"
import { reaction } from "mobx"
import clientStore from "stores/ClientStore"
import userStore from "stores/User"
import { executeIfPresent } from "util/callback"
import createSwitchboardClient from "util/switchboard/switchboard-client"
import { listenToFeed, publishClientMedia } from "util/voice-client"
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
	const clientconnection = await listenToFeed(room, participant.id)
	clientconnection.ondatachannel = console.log
	userStore.removeUserFromPending(participant.display)
	userStore.addUserToListening(participant.display)
}

let disposeRoomHandler
let mediaPublisher
let clientListener
let dataChannel

function startMediaPublisher(room) {
	return new Promise(async (resolve) => {
		mediaPublisher = await publishClientMedia(room)
		resolve()
	})
}

function stopMediaPublisher() {
	return new Promise(async (resolve) => {
		const session = await userStore.session.videoRoom().defaultHandle()
		await session.unpublish()
		await session.leave()
		mediaPublisher.close()
		resolve()
	})
}

function startClientListener(room) {
	return new Promise(async (resolve) => {
		console.info("Listening to participants")
		const response = await listParticipants(room)

		console.info("Filtering participants:", response.participants)
		response.participants
			.filter(notListeningTo)
			.forEach(async participant => await listenToParticipant(room, participant))

		clientListener = setTimeout(async () => await startClientListener(room), 2000)
		resolve()
	})
}

function stopClientListener() {
	return new Promise((resolve) => {
		clearTimeout(clientListener)
		clientStore.clearPeerClients()
		userStore.clearListener()
		resolve()
	})
}

function startDataChannel() {
	return new Promise((resolve) => {
		dataChannel = mediaPublisher.createDataChannel("sendDataChannel", {
			maxRetransmits: 0,
			reliable: false,
		})
		resolve()
	})
}

function stopDataChannel() {
	return new Promise((resolve) => {
		dataChannel.close()
		resolve()
	})
}

const handleConnect = client => () => {
	console.info("Creating client session")
	client.createSession().then(assignSession).then(createSwitchboardClient).catch(handleError)

	console.info("Starting room handler")
	disposeRoomHandler = reaction(() => userStore.room, async (room, previousRoom) => {
		if (!room) {
			console.info("Ignoring room update. No room assigned yet!")
			return
		}

		if (room === previousRoom) {
			console.info("Ignoring room update. Room is same as previous!")
			return
		}

		if (mediaPublisher) {
			console.info("Closing media publisher:", mediaPublisher)
			await stopMediaPublisher()
		}

		if (clientListener) {
			console.info("Clearing client listener timeout:", clientListener)
			await stopClientListener()
		}

		console.info("Publishing media to room:", room)
		await startMediaPublisher(room)
		await startClientListener(room)
		await startDataChannel(mediaPublisher)
	})
}

async function handleDisconnected() {
	console.info("Disconnecting client")
	if (dataChannel) await stopDataChannel()
	if (mediaPublisher) await stopMediaPublisher()
	if (clientListener) await stopClientListener()

	console.info("Disposing room handler")
	executeIfPresent(disposeRoomHandler)

	console.info("Removing client session")
	userStore.setSession(null)
}

function handleError(error) {
	console.info("An error ocurred:", error)
}

function handleEvent(event) {
	console.info("Event occurred:", event)
}

export default function createJanusClient(token) {
	const client = new JanusClient({ url: "wss://vapi.veltpvp.com/janus", reconnect: true, token })
	client.onConnected(handleConnect(client))
	client.onDisconnected(handleDisconnected)
	client.onError(handleError)
	client.onEvent(handleEvent)

	return client
}

function sendDataMessage(message) {
	console.log("dataChannel: ", dataChannel)
	if (dataChannel) {
		const { readyState } = dataChannel
		console.log("dataChannel.readyState: ", readyState)
		if (readyState === "open") {
			dataChannel.send(message)
		}
	}
}

export { sendDataMessage }
