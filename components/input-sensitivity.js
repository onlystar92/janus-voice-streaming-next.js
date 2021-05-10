import { useState, useRef, useEffect } from "react"
import * as R from "ramda"
import AudioMeter from "../util/sound-meter"
import Slider from "./slider"

function SensitivityIndicator() {
	const [sensitivity, setSensitivity] = useState(0)
	const audioMeter = useRef()
	const listenTask = useRef()

	function listenToVolumeChanges(delay) {
		if (sensitivity === audioMeter.current.volume) {
			return setTimeout(() => listenToVolumeChanges(delay), delay)
		}

		setSensitivity(audioMeter.current.volume)
		return setTimeout(() => listenToVolumeChanges(delay), delay)
	}

	useEffect(() => {
		async function loadAudioMeter() {
			try {
				window.AudioContext = window.AudioContext || window.webkitAudioContext
				window.audioContext = new AudioContext()
			} catch (e) {
				alert("Web Audio API not supported.")
			}

			const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
			const mediaStreamSource = window.audioContext.createMediaStreamSource(stream)

			// Create a new volume meter and connect it.
			audioMeter.current = AudioMeter(window.audioContext)
			mediaStreamSource.connect(audioMeter.current)

			// Resume audio context
			window.audioContext.resume()
		}

		loadAudioMeter()
	}, [])

	useEffect(() => {
		if (!audioMeter.current || R.propEq("volume", null, audioMeter.current)) {
			return
		}

		// Clear timeout of previous task
		if (listenTask.current) {
			clearTimeout(listenTask.current)
		}

		// Assign new task
		listenTask.current = listenToVolumeChanges(20)
	}, [audioMeter.current])

	return (
		<Slider
			className="mt-2"
			initial={sensitivity * 100 * 1.4}
			min={0}
			max={100}
			thumb={false}
			disabled={true}
		/>
	)
}

export default SensitivityIndicator
