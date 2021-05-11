import React from "react"
import { useStopwatch } from "react-timer-hook"

function digitFormat(value) {
	return value >= 10 ? value : "0" + value
}

const Timer = () => {
	const { seconds, minutes, hours } = useStopwatch({ autoStart: true })

	return (
		<div className="text-primary-text text-xs mt-2">
			<span>{digitFormat(hours)}</span>:<span>{digitFormat(minutes)}</span>:
			<span>{digitFormat(seconds)}</span>
		</div>
	)
}

export default Timer
