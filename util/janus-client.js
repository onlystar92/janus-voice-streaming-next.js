import { Janus as JanusClient } from "janus-videoroom-client"
import * as R from "ramda"

const callFunctionIfPresent = R.unless(R.isNil, R.call)

export default function createJanusClient(token) {
	const client = new JanusClient({ url: "wss://api.godcomplex.org/janus", reconnect: true, token })
	let session, onConnect, onDisconnect, onError

	function assignAsSession(newSession) {
		console.info("Assigning new session value:", newSession)
		session = newSession
	}

	// Handle client connection
	async function handleConnect(event) {
		console.info("Client connected to janus")

		try {
			console.info("Creating and assigning client session")
			await client.createSession().then(assignAsSession)

			console.info("Executing success callback")
			await callFunctionIfPresent(onConnect, [event])
		} catch (err) {
			console.error(err.name + ": " + err.message)
		}
	}

	// Handle client disconnect
	async function handleDisconnect(event) {
		if (session != null) {
			console.info("Destroying client session")
			await client.destroySession(session.id)
		}

		// Set session to null
		assignAsSession(null)

		console.info("Client disconnected")
		await callFunctionIfPresent(onDisconnect, [event])
	}

	// Handle client error
	async function handleError(error) {
		console.error("An error ouccurred on the client:", error)
		await callFunctionIfPresent(onError, [error])
	}

	// Add client event handlers
	client.onConnected(handleConnect)
	client.onDisconnected(handleDisconnect)
	client.onError(handleError)

	return {
		token,
		client,
		getSession() {
			return session
		},
		onConnect(callback) {
			onConnect = callback
		},
		onDisconnect(callback) {
			onDisconnect = callback
		},
		onError(callback) {
			onError = callback
		},
	}
}
