import { forwardRef, useEffect, useRef, useState } from "react"
import clsx from "clsx"
import Settings from "@icons/Settings"
import SettingsModal from "@components/settings-modal"
import { observer } from "mobx-react-lite"

const SettingsButton = forwardRef(({ open, onClick }, ref) => (
	<div ref={ref} className="relative">
		<button className="focus:outline-none" onClick={onClick} aria-label="Settings">
			<Settings className="text-white w-6 h-6 sm:h-6" />
		</button>
		<div
			className={clsx(
				"absolute w-96 top-8 -right-3 origin-center transform-gpu transition-all duration-200",
				{
					"opacity-0 scale-75 z-0": !open,
					"opacity-100 z-20": open,
				},
			)}
		>
			<SettingsModal />
		</div>
	</div>
))

const Navigation = () => {
	const [settingsOpen, setSettingsOpen] = useState(false)
	const settingsButton = useRef()

	useEffect(() => {
		document.addEventListener("mousedown", handleClickAway)
		return () => {
			document.removeEventListener("mousedown", handleClickAway)
		}
	}, [])

	function handleSettingsClick() {
		setSettingsOpen(!settingsOpen)
	}

	function handleClickAway(event) {
		if (!settingsButton || !settingsButton.current) {
			return
		}

		if (settingsButton.current.contains(event.target) || settingsButton.current === event.target) {
			return
		}

		setSettingsOpen(false)
	}

	return (
		<nav
			className={clsx(
				"relative h-16 px-6 flex items-center rounded-b-3xl bg-secondary-100 ring-8 ring-secondary-200",
				"sm:h-28 md:px-12",
			)}
		>
			<img
				className="absolute w-40 left-6 lg:w-44 lg:left-12"
				src="/velt-voice.png"
				alt="Velt voice"
				width="auto"
				height="auto"
			/>
			<img
				className="absolute inset-0 top-12 m-auto hidden w-20 self-start sm:block lg:w-28"
				src="/velt-logo.png"
				alt="Velt logo"
			/>
			<div className="absolute right-6 lg:right-12">
				<SettingsButton ref={settingsButton} open={settingsOpen} onClick={handleSettingsClick} />
			</div>
		</nav>
	)
}

export default observer(Navigation)
