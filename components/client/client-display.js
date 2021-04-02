import clsx from "clsx"
import ClientInputDisplay from "./client-input-display"
import Microphone from "@icons/Microphone"
import MicrophoneMuted from "@icons/MicrophoneMuted"
import Volume from "@icons/Volume"
import VolumeMuted from "icons/VolumeMuted"
import { observer } from "mobx-react-lite"
import { useRef } from "react"

const variants = {
	self: {
		className: "bg-primary-text text-secondary-text",
		icon: Microphone,
		mutedIcon: MicrophoneMuted,
	},
	other: {
		className: "bg-secondary-200 text-primary-text",
		icon: Volume,
		mutedIcon: VolumeMuted,
	},
}

const ClientDisplay = ({ className, client, variant = "other" }) => {
	const audioRef = useRef()
	const activeVariant = variants[variant] ?? variants.other
	const variantStyles = clsx("tracking-wide", activeVariant.className)
	return (
		<div
			className={clsx(
				className,
				"p-2 px-2 flex justify-between items-center rounded-lg shadow-sm bg-primary-200",
				"lg:px-4",
			)}
		>
			<audio className="hidden" ref={audioRef} />
			<div className="flex items-center">
				<img className="w-8 h-auto lg:w-14" src={client.image} />
				<span
					className={clsx(
						variantStyles,
						"px-2 py-1 ml-2",
						"text-sm font-bold rounded-md",
						"xl:px-4 xl:py-2",
						"xl:rounded-xl xl:px-4 xl:py-2 xl:text-lg",
					)}
				>
					{client.name}
				</span>
			</div>
			<ClientInputDisplay className={variantStyles} client={client} variant={activeVariant} />
		</div>
	)
}

export default observer(ClientDisplay)
