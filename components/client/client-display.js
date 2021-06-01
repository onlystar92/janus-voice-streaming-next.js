import { useEffect, useRef, useState } from "react"
import { autorun } from "mobx"
import { observer } from "mobx-react-lite"
import clsx from "clsx"
import userStore from "stores/User"
import ClientInput from "./client-input"
import hark from "hark"

async function findDeviceIdByName(name) {
	const devices = await navigator.mediaDevices.enumerateDevices()
	return devices.find(device => device.label === name)
}

function fetchUserAvatar(username) {
	return fetch(`/api/avatar?user=${username}`)
}

function ClientAvatar({ client }) {
	const { username } = client
	const [avatar, setAvatar] = useState("/steve-avatar.png")
	const [muted, setMuteStatus] = useState(false)

	useEffect(() => {
		if (!username) return

		async function resolveClientAvatar() {
			const response = await fetchUserAvatar(username)

			if (!response || response.status === 500) {
				return
			}

			const parsedResponse = await response.json()
			setAvatar(parsedResponse.avatar)
		}

		resolveClientAvatar()
	}, [username])

	useEffect(() => {
		return autorun(() => {
			const stream = client.stream

			if (!stream) return

			stream.getTracks()[0].onmute = function () {
				console.log("stream muted", "muted")
			}

			stream.getTracks()[0].onunmute = function () {
				console.log("stream unmuted", "unmuted")
			}
		})
	}, [])

	return <img className="w-8 h-auto lg:w-14" src={avatar} alt={username + "'s avatar"} />
}

function resolveClientType(client) {
	return client.username === userStore.username ? "self" : "peer"
}

function ClientDisplay({ client }) {
	const clientType = resolveClientType(client)
	const audioRef = useRef()
	const [isSpeaking, setIsSpeaking] = useState(false)
	const isMuted = userStore.settings.muted
	const isUser = userStore.uuid === client.uuid

	useEffect(() => {
		if (clientType !== "self" || client.stream) {
			return
		}

		async function assignSelfStream() {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
			client.setStream(stream)
		}

		assignSelfStream()
	}, [])

	// Handle stream change
	useEffect(() => {
		const disposeStreamHandler = autorun(() => {
			const stream = client.stream

			if (!stream) {
				return
			}

			console.info("Started speech analyzer")
			let options = {}
			let speechEvents = hark(stream, options)

			speechEvents.on("speaking", () => {
				setIsSpeaking(true)
			})

			speechEvents.on("stopped_speaking", () => {
				setIsSpeaking(false)
			})

			console.info("Updating audio stream")
			if (!audioRef.current) {
				return
			}

			audioRef.current.srcObject = stream
			console.info("Updated audio stream")
		})

		return () => disposeStreamHandler()
	}, [])

	// Handle preferred output change
	useEffect(() => {
		return autorun(async () => {
			const preferredOutput = userStore.settings.preferredOutput

			if (!audioRef.current || !preferredOutput) {
				return
			}

			if (!audioRef.current.setSinkId) {
				return
			}

			let device = await findDeviceIdByName(preferredOutput)

			if (!device || !device.deviceId) {
				const devices = await navigator.mediaDevices.enumerateDevices()

				if (devices.length === 0 || !devices[0]) {
					return
				}

				audioRef.current.setSinkId(devices[0].deviceId)
				return
			}

			audioRef.current.setSinkId(device.deviceId)
		})
	}, [])

	// Handle master volume change
	useEffect(() => {
		return autorun(() => {
			if (!audioRef.current) {
				return
			}

			console.info("Changing output volume to:", userStore.settings.outputVolume)
			audioRef.current.audio = userStore.settings.outputVolume
		})
	}, [])

	return (
		<>
			<div
				className={clsx(
					"mt-2 z-10 p-2 px-2 flex justify-between items-center rounded-lg shadow-sm bg-primary-200",
					"sm:m-0",
					"lg:px-4",
					{
						"ring-2 ring-green-700": (isUser && !isMuted && isSpeaking) || (!isUser && isSpeaking),
					},
				)}
			>
				<div className="flex items-center">
					<ClientAvatar client={client} />
					<span
						className={clsx(
							"px-2 py-1 ml-2",
							"text-sm font-bold rounded-md",
							"xl:px-4 xl:py-2",
							"xl:rounded-xl xl:px-4 xl:py-2 xl:text-lg",
							{
								"bg-primary-text text-secondary-text ": clientType === "self",
								"bg-secondary-200 text-primary-text": clientType === "peer",
							},
						)}
					>
						{client.username}
					</span>
				</div>
				<ClientInput client={client} type={clientType} />
			</div>
			{clientType === "peer" && (
				<audio ref={audioRef} className="hidden" controls={false} muted autoPlay playsInline />
			)}
		</>
	)
}

export default observer(ClientDisplay)
