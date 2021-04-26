import Slider from "@components/slider"
import Select from "@components/select"
import { useEffect, useState } from "react"
import NavigationArrow from "icons/NavigationArrow"
import { observer } from "mobx-react-lite"
import { userStore } from "stores/User"
import * as R from "ramda"

const findMediaDevicesByKind = async kind => {
	if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
		alert("getUserMedia() is not supported by your browser")
	}

	// Request access to audio
	await navigator.mediaDevices.getUserMedia({ audio: true })

	// Filter devices by kind
	const devices = await navigator.mediaDevices.enumerateDevices()
	return devices.filter(device => device.kind === kind)
}

async function findInputDevices() {
	const inputDevices = await findMediaDevicesByKind("audioinput")
	return R.pluck("label", inputDevices)
}

async function findOutputDevices() {
	const outputDevices = await findMediaDevicesByKind("audiooutput")
	return R.pluck("label", outputDevices)
}

function Divider() {
	return <div className="mt-2 border border-solid border-primary-100 rounded-lg" />
}

function SettingsModal() {
	const [inputDevices, setInputDevices] = useState(["Default"])
	const [outputDevices, setOutputDevices] = useState(["Default"])

	useEffect(() => {
		async function fetchAudioDevices() {
			const foundInputs = await findInputDevices()
			const foundOutputs = await findOutputDevices()
			setInputDevices([...inputDevices, ...foundInputs])
			setOutputDevices([...outputDevices, ...foundOutputs])
		}

		fetchAudioDevices()
	}, [])

	function handleOutputVolumeChange(volume) {
		userStore.settings.setOutputVolume(volume)
	}

	function handleInputVolumeChange(volume) {
		userStore.settings.setInputVolume(volume)
	}

	function handleInputSelect(input) {
		userStore.settings.setPreferredInput(input)
	}

	function handleOutputSelect(output) {
		userStore.settings.setPreferredOutput(output)
	}

	return (
		<div className="relative top-4">
			<NavigationArrow className="absolute h-8 w-8 -top-4 right-2 fill-current text-secondary-300" />
			<div className="p-4 text-primary-text bg-secondary-300 rounded-xl">
				<span className="text-2xl font-bold">Audio Settings</span>
				<Divider />
				<div className="flex flex-col font-semibold">
					<div className="mt-4">
						<span>Master Volume</span>
						<Slider className="mt-2" onChange={handleOutputVolumeChange} />
					</div>
					<div className="mt-4">
						<span>Input Volume</span>
						<Slider className="mt-2" onChange={handleInputVolumeChange} />
					</div>
					<div className="mt-4">
						<span>Output Device</span>
						<Select
							className="mt-2"
							selected={userStore?.settings?.preferredOutput ?? outputDevices[0]}
							values={outputDevices}
							onSelect={handleOutputSelect}
						/>
					</div>
					<div className="mt-4">
						<span>Input Device</span>
						<Select
							className="mt-2"
							selected={userStore?.settings?.preferredInput ?? inputDevices[0]}
							values={inputDevices}
							onSelect={handleInputSelect}
						/>
					</div>
				</div>
			</div>
		</div>
	)
}

export default observer(SettingsModal)
