import React, { useEffect } from "react"
import Head from "next/head"
import Footer from "components/footer"
import Navigation from "components/navigation"
import ClientListView from "components/client/client-list-view"
import { publishClientMedia, listenToNewFeeds } from "util/voice-client"
import { initializeStore, userStore, saveCurrentUser } from "stores/User"
import { observer } from "mobx-react-lite"
import clientStore from "stores/ClientStore"
import { wrapVideoRoom } from "util/video-room"
import createJanusClient from "util/janus-client"
import { Session } from "stores/User"

async function moveClientToRoom(room) {
	const response = await fetch("/api/move", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ room }),
	})
	return await response.json()
}

async function loadUserFromLocalStorage() {
	return await new Promise(async resolve => {
		if (userStore) {
			console.info("Using already loaded user")
			resolve()
			return
		}

		console.info("Retreiving user from local storage")
		const user = localStorage.getItem("user")

		if (user) {
			console.info("Initializing store with user:", user)
			const response = JSON.parse(user)
			const parsedRoom = response && response.room ? parseInt(response.room) : null
			initializeStore(response.token, response.username, parsedRoom)
		}

		if (!user) {
			console.info("No user available. Initializing empty store.")
			initializeStore()
			await saveCurrentUser()
		}

		resolve()
	})
}

function handleClientConnected() {}

function handleClientDisconnected() {}

function handleConnectionClose() {}

function handleStream(feed, { streams: [stream] }) {
	console.info("Handling stream")

	function insertStreamToClient(stream, id) {
		const client = clientStore.getClient(id)
		client.setStream(stream)
	}

	function recursivelyInsertStream(stream, id) {
		if (!clientStore.contains(feed)) {
			setTimeout(() => recursivelyInsertStream(stream, id), 500)
			return
		}

		insertStreamToClient(stream, id)
	}

	recursivelyInsertStream(stream, feed)
}

function createVoiceClient(token) {
	const client = createJanusClient(token)

	client.onConnect(async () => {
		console.info("Initializing client session")
		const session = new Session(client.getSession().getId())
		userStore.setSession(session)

		if (!userStore.room) {
			console.info("Moving to default room:", 4054723098316357)
			userStore.setRoom(4054723098316357)
			await moveClientToRoom(userStore.room)
		}

		const videoRoom = wrapVideoRoom(client, userStore.room)

		console.info("Publishing client media to room")
		await publishClientMedia(videoRoom).catch(err =>
			console.error("Failed to publish client media:", err),
		)

		console.info("Listen to new feeds")
		await listenToNewFeeds(
			videoRoom,
			handleClientConnected,
			handleClientDisconnected,
			handleConnectionClose,
			handleStream,
		).catch(err => console.error("Failed to listen for incoming feeds:", err))
	})

	client.onDisconnect(() => {
		console.info("Client disconnected")
		const current = clientStore.getClient(userStore.session.publisherId)
		clientStore.removeClient(current)
	})

	window.addEventListener("beforeunload", () => {
		client.client.disconnect()
	})

	return client.client
}

function Home() {
	useEffect(() => {
		// Load user data
		loadUserFromLocalStorage()

		// Connect client
		const client = createVoiceClient(userStore.token)
		client.connect()

		// Disconnect from client after effect
		return () => {
			client.disconnect()
		}
	}, [])

	return (
		<div>
			<Head>
				<title>Velt Voice</title>
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<main className="bg-primary-100">
				<Navigation />
				<ClientListView clients={clientStore.clients} />
				<Footer />
			</main>
		</div>
	)
}

export default observer(Home)
