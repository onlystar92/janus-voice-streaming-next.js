import { useEffect, useRef, useState } from "react"
import { autorun } from "mobx"
import { observer } from "mobx-react-lite"
import clsx from "clsx"
import { userStore } from "stores/User"
import ClientInput from "./client-input-display"
import Microphone from "icons/Microphone"
import MicrophoneMuted from "icons/MicrophoneMuted"
import Volume from "icons/Volume"
import VolumeMuted from "icons/VolumeMuted"

const clientTypes = {
	self: {
		className: "bg-primary-text text-secondary-text",
		icon: Microphone,
		mutedIcon: MicrophoneMuted,
	},
	peer: {
		className: "bg-secondary-200 text-primary-text",
		icon: Volume,
		mutedIcon: VolumeMuted,
	},
}

function resolveType(client) {
	return client.username === userStore.username ? clientTypes.self : clientTypes.peer
}

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

	useEffect(() => {
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

	return <img className="w-8 h-auto lg:w-14" src={avatar} alt={username + "'s avatar"} />
}

function ClientDisplay({ client }) {
	const type = resolveType(client)
	const audioRef = useRef()

	// Handle stream change
	useEffect(() => {
		return autorun(() => {
			const stream = client.stream

			if (!audioRef.current || !stream) {
				return
			}

			audioRef.current.srcObject = stream
			// audioRef.current.src = window.URL.createObjectURL(client.stream)
			audioRef.current.play()
			console.info("Updated display component")
		})
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
				)}
			>
				<div className="flex items-center">
					<ClientAvatar client={client} />
					<span
						className={clsx(
							type.className,
							"px-2 py-1 ml-2",
							"text-sm font-bold rounded-md",
							"xl:px-4 xl:py-2",
							"xl:rounded-xl xl:px-4 xl:py-2 xl:text-lg",
						)}
					>
						{client.username}
					</span>
				</div>
				<ClientInput client={client} type={type} />
			</div>
			<audio ref={audioRef} className="hidden" autoPlay playsInline controls={false} />
		</>
	)
}

export default observer(ClientDisplay)
