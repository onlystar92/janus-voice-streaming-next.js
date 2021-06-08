import React, { useRef, useState } from "react"
import { observer } from "mobx-react-lite"
import * as R from "ramda"
import clsx from "clsx"
import userStore from "stores/User"
import Slider from "components/slider"
import Volume from "icons/Volume"
import MicrophoneMuted from "icons/MicrophoneMuted"
import VolumeMuted from "icons/VolumeMuted"
import Microphone from "icons/Microphone"
import CloseSession from "icons/CloseSession"

function PeerInput({ client }) {
	const [open, setOpen] = useState(false)
	const containerRef = useRef()
	const sliderRef = useRef()

	function handlePeerVolumeChange(volume) {
		client.setVolume(volume)
	}

	return (
		<div
			ref={containerRef}
			className={clsx(
				"w-11 flex items-center justify-between",
				"text-primary-text bg-secondary-200 rounded-full",
				"transition-all duration-150 ease-in-out",
				{ "w-1/2": open },
			)}
			onMouseEnter={() => setOpen(true)}
			onMouseLeave={() => setOpen(false)}
		>
			<div className="p-3">
				<Volume className="h-3 md:h-4 lg:h-5" />
			</div>
			<Slider
				ref={sliderRef}
				className={clsx({
					"opacity-0": !open,
					"w-full opacity-100 mr-3": open,
				})}
				initial={R.propOr(100, "volume", client)}
				min={0}
				max={100}
				thumb={false}
				onChange={handlePeerVolumeChange}
			/>
		</div>
	)
}

function SelfInput({ closeSession }) {
	const muted = userStore.settings.muted
	const defen = userStore.settings.defen
	const MuteIcon = muted ? MicrophoneMuted : Microphone
	const DefenIcon = defen ? VolumeMuted : Volume

	function setMuted() {
		userStore.settings.setMuted(!userStore.settings.muted)
	}

	function setDefen() {
		userStore.settings.setDefen(!userStore.settings.defen)
	}

	return (
		<div>
			<button
				className={clsx(
					"p-2 md:p-2 lg:p-3",
					"rounded-full outline-none transition-all ease-linear focus:outline-none",
					{
						"text-primary-text bg-red-500": defen,
						"bg-primary-text text-secondary-text": !defen,
					},
				)}
				onClick={setDefen}
			>
				<DefenIcon className="h-3 md:h-4 lg:h-5" />
			</button>
			<button
				className={clsx(
					"p-2 md:p-2 lg:p-3 mx-2",
					"rounded-full outline-none transition-all ease-linear focus:outline-none",
					{
						"text-primary-text bg-red-500": muted,
						"bg-primary-text text-secondary-text": !muted,
					},
				)}
				onClick={setMuted}
			>
				<MuteIcon className="h-3 md:h-4 lg:h-5" />
			</button>
			<button
				className="p-2 md:p-2 lg:p-3 rounded-full outline-none transition-all ease-linear focus:outline-none bg-red-500 text-secondary-text"
				onClick={closeSession}
			>
				<CloseSession className="h-3 md:h-4 lg:h-5" />
			</button>
		</div>
	)
}

function ClientInput({ client, type = "peer", closeSession }) {
	let ClientInput

	switch (type) {
		case "self":
			ClientInput = observer(SelfInput)
			break
		case "peer":
		default:
			ClientInput = observer(PeerInput)
			break
	}

	return <ClientInput client={client} closeSession={closeSession} />
}

export default observer(ClientInput)
