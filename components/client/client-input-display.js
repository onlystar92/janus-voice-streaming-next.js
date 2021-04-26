import React from "react"
import clsx from "clsx"
import { observer } from "mobx-react-lite"
import clientStore from "stores/ClientStore"
import { userStore } from "stores/User"

function toggleVolume(volume) {
	if (volume != 0) return 0
	else return 100
}

const ClientInputDisplay = ({ client, type }) => {
	const isPeer = client.username !== userStore.username
	const muted = isPeer ? client.volume === 0 : userStore.settings.muted
	const Icon = muted ? type.mutedIcon : type.icon

	function handleClick(event) {
		event.preventDefault()

		if (isPeer) return

		// Mute user
		userStore.settings.setMuted(!userStore.settings.muted)

		// Toggle volume
		const storedClient = clientStore.getClient(client.id)
		const newVolume = toggleVolume(storedClient.volume)
		storedClient.setVolume(newVolume)
	}

	return (
		<button
			className={clsx(
				"p-2 rounded-full transition-all ease-out outline-none focus:outline-none",
				"md:p-2 lg:p-3",
				{
					"text-primary-text bg-red-500": muted,
					[type.className]: !muted,
				},
			)}
			onClick={handleClick}
		>
			<Icon className="h-3 md:h-4 lg:h-5" />
		</button>
	)
}

export default observer(ClientInputDisplay)
