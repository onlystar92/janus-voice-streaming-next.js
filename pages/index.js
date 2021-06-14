import React, { useCallback, useEffect, useState } from "react"
import Head from "next/head"
import { observer } from "mobx-react-lite"
import createJanusClient from "util/janus/janus-client"
import userStore from "stores/User"
import clientStore from "stores/ClientStore"
import Footer from "components/footer"
import Navigation from "components/navigation"
import ClientListView from "components/client/client-list-view"

function createAudioContext() {
	const audioContext = new AudioContext() || new webkitAudioContext()

	// Resume audio context if suspended
	if (audioContext.state === "suspended") {
		audioContext.resume()
	}

	// Set default listener position
	audioContext.listener.positionX.value = 0
	audioContext.listener.positionY.value = 0
	audioContext.listener.positionZ.value = 0
	audioContext.listener.forwardX.value = 0
	audioContext.listener.forwardY.value = 0
	audioContext.listener.forwardZ.value = 0
	audioContext.listener.upX.value = 0
	audioContext.listener.upY.value = 0
	audioContext.listener.upZ.value = 0

	// Initialize audio context
	userStore.setAudioContext(audioContext)
}

function Home() {
	const [janusClient, setJanusClient] = useState(null)

	// Disconnects the janus client
	const closeSession = useCallback(() => {
		if (!janusClient || !janusClient.isConnected()) return
		janusClient.disconnect()
		setJanusClient(null)
	}, [janusClient])

	useEffect(() => {
		try {
			createAudioContext()
		} catch (error) {
			return console.error(error)
		}

		// Initialize client
		const janusClient = createJanusClient(userStore.token)
		janusClient.connect()
		setJanusClient(janusClient)

		// Close session on component unrender
		return closeSession
	}, [])

	return (
		<div>
			<Head>
				<title>Velt Voice</title>
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<main className="bg-primary-100">
				<Navigation />
				<ClientListView clients={clientStore.clients} closeSession={closeSession} />
				<Footer />
				<div className="fixed bottom-5 right-5 z-50 mt-2 p-2 px-2 flex flex-col justify-center items-center rounded-lg shadow-sm bg-primary-200 sm:m-0 lg:px-4">
					<div
						className="flex flex-row justify-center items-baseline h-12 w-20"
						id="networkQuality"
					>
						<div className="flex-1 mx-1 h-1/5"></div>
						<div className="flex-1 mx-1 h-2/5"></div>
						<div className="flex-1 mx-1 h-3/5"></div>
						<div className="flex-1 mx-1 h-4/5"></div>
						<div className="flex-1 mx-1 h-full"></div>
					</div>
					<div className="text-primary-text text-sm mt-2 text-center" id="duration" />
				</div>
			</main>
		</div>
	)
}

export default observer(Home)
