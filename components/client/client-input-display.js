import React from "react"
import clsx from "clsx"
import { observer } from "mobx-react-lite"

React.useLayoutEffect = React.useEffect

const ClientInputDisplay = ({ className, client, variant }) => {
	const isMuted = client.status === "Muted"
	const Icon = isMuted ? variant.mutedIcon : variant.icon

	const handleToggle = () => {
		if (isMuted) {
			client.setStatus("Rest")
		} else {
			client.setStatus("Muted")
		}
	}

	return (
		<button
			className={clsx(
				{
					[className]: !isMuted,
					"text-primary-text bg-red-500": isMuted,
				},
				"p-2 rounded-full transition-all duration-200 ease-out focus:outline-none active:outline-none",
				"md:p-2 lg:p-3",
			)}
			onClick={handleToggle}
		>
			<Icon className="h-3 md:h-4 lg:h-5" />
		</button>
	)
}

export default observer(ClientInputDisplay)
