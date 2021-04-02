import React, { useEffect, useRef } from "react"
import Head from "next/head"
import clsx from "clsx"
import Footer from "@components/footer"
import Navigation from "@components/navigation"
import ClientListView from "@components/client/client-list-view"
import VoiceClient from "util/voice-client"
import { initializeStore, userStore, saveCurrentSnapshot } from "stores/UserStore"
import { observer } from "mobx-react-lite"

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
	return await new Promise(resolve => {
		if (userStore) {
			console.info("Using already loaded user")
			resolve()
			return
		}

		console.info("Retreiving user from local storage")
		const user = localStorage.getItem("user")

		if (user) {
			console.info("Initializing store with user:", user)
			const parsedUser = JSON.parse(user)
			const initialState = {
				token: parsedUser.token,
				username: parsedUser.username,
				room: parseInt(parsedUser.room ?? -1),
			}
			initializeStore(initialState)
		}

		if (!userStore) {
			console.info("No user available. Initializing empty store.")
			initializeStore()
			saveCurrentSnapshot()
		}

		resolve()
	})
}

function Home() {
	const audioRef = useRef()

	useEffect(() => {
		async function setupClient(token, room) {
			const client = new VoiceClient(token, room)

			client.onConnectSuccess(async () => {
				console.info("Publishing user media to room")
				await client.publishUserMedia(room).catch("Failed to publish user media")

				console.info("Listen to new feeds")
				await client.listenToFeeds(room)
			})

			client.onStreamReceived(({ streams: [stream] }) => {
				audioRef.current.srcObject = stream
			})

			await client
				.connect()
				.catch(err => console.error("An error ocurred while connecting to the server", err))
		}

		loadUserFromLocalStorage()

		// Move to room if not in room
		if (!userStore.room || userStore.room === -1) {
			userStore.setRoom(2917855264617619)
			console.info(`Moving client ${userStore.player} to room ${userStore.room}`)
			moveClientToRoom(userStore.room)
		}

		// Set up client connection
		setupClient(userStore.token, userStore.room)
	})

	return (
		<div>
			<Head>
				<title>Velt Voice</title>
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<main className="bg-primary-100">
				<audio ref={audioRef} autoPlay />
				<Navigation />
				<ClientListView
					className={clsx(
						"px-6 py-4 flex flex-col items-stretch",
						"sm:grid sm:grid-cols-2 sm:items-start sm:gap-y-2 sm:gap-x-2",
						"md:grid-cols-2 md:gap-y-2 md:gap-x-2 md:py-6",
						"lg:px-12 lg:grid-cols-3 lg:gap-y-3 lg:gap-x-10 lg:py-10",
					)}
				/>
				<Footer />
			</main>
		</div>
	)
}

export default observer(Home)
