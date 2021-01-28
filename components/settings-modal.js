import Slider from "@components/slider"
import Select from "@components/select"
import { useEffect, useState } from "react"
import NavigationArrow from "icons/NavigationArrow"

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

const getAudioInputDevices = async () => {
	const inputDevices = await findMediaDevicesByKind("audioinput")
	return inputDevices.map(device => device.label)
}

const getAudioOutputDevices = async () => {
	const outputDevices = await findMediaDevicesByKind("audiooutput")
	return outputDevices.map(device => device.label)
}

const Divider = () => <div className="mt-2 border border-solid border-primary-100 rounded-lg" />

const SettingsModal = ({ className }) => {
	const [audioDevices, setAudioDevices] = useState({ input: [], output: [] })

	useEffect(() => {
		const fetchAudioDevices = async () => {
			setAudioDevices({
				input: await getAudioInputDevices(),
				output: await getAudioOutputDevices(),
			})
		}

		fetchAudioDevices()
	}, [])

	return (
		<div className="relative top-4">
			<NavigationArrow className="absolute h-8 w-8 -top-4 right-2 fill-current text-secondary-300" />
			<div className="p-4 text-primary-text bg-secondary-300 rounded-xl">
				<span className="text-2xl font-bold">Audio Settings</span>
				<Divider />
				<div className="flex flex-col font-semibold">
					<div className="mt-4">
						<span>Master Volume</span>
						<Slider className="mt-2" />
					</div>
					<div className="mt-4">
						<span>Input Volume</span>
						<Slider className="mt-2" />
					</div>
					<div className="mt-4">
						<span>Output Device</span>
						<Select className="mt-2" values={audioDevices.output} />
					</div>
					<div className="mt-4">
						<span>Input Device</span>
						<Select className="mt-2" values={audioDevices.input} />
					</div>
				</div>
			</div>
		</div>
	)
}

export default SettingsModal
