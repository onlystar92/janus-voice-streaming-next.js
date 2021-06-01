import userStore from "stores/User"
import clientStore, { Client } from "stores/ClientStore"
import {
	parseStringPositions,
	calculateForwardDirectionVector,
	calculateHeadDirectionVector,
} from "./positions"

function updateUserPosition(position) {
	userStore.audioContext.listener.positionX.value = position.x
	userStore.audioContext.listener.positionY.value = position.y
	userStore.audioContext.listener.positionZ.value = position.z

	const headVector = calculateHeadDirectionVector(position)
	userStore.audioContext.listener.upX.value = headVector.x
	userStore.audioContext.listener.upY.value = headVector.y
	userStore.audioContext.listener.upZ.value = headVector.z

	const forwardVector = calculateForwardDirectionVector(position)
	userStore.audioContext.listener.forwardX.value = forwardVector.x
	userStore.audioContext.listener.forwardY.value = forwardVector.y
	userStore.audioContext.listener.forwardZ.value = forwardVector.z
}

function updatePeerPosition(client, position) {
	if (!client.node) return

	// Update coordinates
	client.node.positionX.value = position.x
	client.node.positionY.value = position.y
	client.node.positionZ.value = position.z

	// Update forward direction
	const forwardVector = calculateForwardDirectionVector(position)
	client.node.orientationX.value = forwardVector.x
	client.node.orientationY.value = forwardVector.y
	client.node.orientationZ.value = forwardVector.z
}

function initializeUserClient(uuid, token, room) {
	// Update user information
	userStore.setUUID(uuid)
	userStore.setToken(token)
	userStore.setRoom(room)

	// Create user client
	const userClient = new Client()
	userClient.setUUID(uuid)
	userClient.setRoom(room)
	clientStore.addClient(userClient)
}

function shouldIgnorePosition(firstPosition, secondPosition) {
	return (
		firstPosition.world !== secondPosition.world ||
		firstPosition.server_name !== secondPosition.server_name
	)
}

function handleMessage(event) {
	let message = event.data

	// Parse message
	try {
		message = JSON.parse(message)
	} catch (err) {
		return console.error("Invalid json message:", message)
	}

	switch (message.cmd) {
		case "info":
			const uuid = message.player
			const token = message.token || userStore.token
			const room = message.room || userStore.room
			initializeUserClient(uuid, token, room)
			break
		case "updatePositions":
			const positions = parseStringPositions(message.positions)
			const userClient = clientStore.findByUUID(userStore.uuid)
			const userPosition = positions.find(
				position => position.player === userStore.uuid && position.server_name,
			)

			if (userPosition) {
				if (!userStore.username) {
					userStore.setUsername(userPosition.player_name)
					userClient.setUsername(userPosition.player_name)
				}

				updateUserPosition(userPosition)
			}

			positions
				.filter(position => position.player !== userStore.uuid)
				.forEach(position => {
					const currentUUID = position.player

					// Check if player is in same server and world
					if (shouldIgnorePosition(position, userPosition)) {
						return
					}

					// Add new peer
					let peerClient = clientStore.findByUUID(currentUUID)
					if (!peerClient) {
						peerClient = new Client()
						peerClient.setUsername(position.player_name)
						peerClient.setUUID(currentUUID)
						clientStore.addClient(peerClient)

						// Listen to user
						userStore.listenToUser(currentUUID)
					}

					// Update positions
					updatePeerPosition(peerClient, position)
				})
			break
		case "joinRoom":
			console.info("Message to join room:", message.room)
			userStore.setRoom(message.room || userStore.room)
			break
	}
}

function handleOpen(event) {
	console.info("Switchboard socket open")
	console.info("Event:", event)
}

function handleClose(event) {
	console.info("Connection closing")
}

function handleError(error) {
	console.info("Socket error ocurred")
	console.info("Error:", error)
}

export default function createSwitchboardClient() {
	const socket = new WebSocket("wss://api.godcomplex.org")
	socket.onopen = handleOpen
	socket.onmessage = handleMessage
	socket.onclose = handleClose
	socket.onerror = handleError

	function updateSettings() {
		// TODO: Implement update settings method
	}

	return { socket }
}
