import { forwardRef, useLayoutEffect, useRef } from "react"
import clsx from "clsx"

function calculatePercentage(current, min, max) {
	return ((current - min) / (max - min)) * 100
}

function calculateValue(percentage, min, max) {
	return Math.round(((max - min) / 100) * percentage + min)
}

function calculateLeftMargin(percentage, width, minWidth = 0) {
	return `max(calc(${percentage}% - ${width}), ${minWidth})`
}

function calculateWidth(percentage) {
	return `${percentage}%`
}

const Header = forwardRef((_, ref) => (
	<div
		className="opacity-0 transform-gpu transition-opacity duration-75 ease-in absolute bg-primary-100 -top-8 px-2 text-md rounded-md shadow-lg select-none"
		ref={ref}
	/>
))

const ProgressContainer = forwardRef(({ onMouseDown, children }, ref) => (
	<div
		ref={ref}
		className="relative h-4 bg-white bg-opacity-60 rounded-full overflow-hidden"
		onMouseDown={onMouseDown}
	>
		{children}
	</div>
))

const Progress = forwardRef(({ onMouseDown }, ref) => (
	<div
		ref={ref}
		className="h-4 absolute bg-primary-100 rounded-full w-full"
		onMouseDown={onMouseDown}
	/>
))

const Thumb = forwardRef(({ onMouseEnter, onMouseLeave, onMouseDown }, ref) => (
	<div
		ref={ref}
		className="absolute w-2 h-6 bg-white rounded-full -top-1/4 cursor-ew-resize"
		onMouseEnter={onMouseEnter}
		onMouseLeave={onMouseLeave}
		onMouseDown={onMouseDown}
	/>
))

const Slider = forwardRef(({ className, initial, min, max, onChange, thumb, disabled }, ref) => {
	const initialPercentage = calculatePercentage(initial, min, max)
	const rangeRef = useRef()
	const rangeProgressRef = useRef()
	const thumbRef = useRef()
	const currentRef = useRef()
	const diff = useRef()

	useLayoutEffect(() => {
		handleUpdate(initial, initialPercentage)
	}, [initial, initialPercentage, handleUpdate])

	function handleUpdate(value, percentage) {
		// Update progress bar
		rangeProgressRef.current.style.width = calculateWidth(percentage)

		// Update thumb position
		if (thumb) {
			thumbRef.current.style.left = calculateLeftMargin(percentage, "8px", "0px")
		}

		// Update header position and value
		if (currentRef.current) {
			const halfOfWidth = currentRef.current.getBoundingClientRect().width / 2
			const width = `${halfOfWidth}px - 4px`
			const minWidth = `-${halfOfWidth}px + 4px`
			currentRef.current.style.left = calculateLeftMargin(percentage, width, minWidth)
			currentRef.current.textContent = `${value}%`
		}
	}

	function handleMouseMove(event) {
		let end = rangeRef.current.offsetWidth
		let differenceX = event.clientX - rangeRef.current.getBoundingClientRect().left

		if (thumb) {
			end -= thumbRef.current.offsetWidth
			differenceX -= diff.current
		}

		const newX = Math.min(Math.max(differenceX, 0), end)
		const newPercentage = calculatePercentage(newX, 0, end)
		const newValue = calculateValue(newPercentage, min, max)

		// Update visuals
		handleUpdate(newValue, newPercentage)

		// Notify of new value
		onChange(newValue)
	}

	function handleProgressClick(event) {
		diff.current = 0
		handleMouseMove(event)
		handleMouseDown(event)
	}

	function handleMouseDown(event) {
		if (thumb) {
			diff.current = event.clientX - thumbRef.current.getBoundingClientRect().left
		}

		// Register listeners
		document.addEventListener("mousemove", handleMouseMove)
		document.addEventListener("mouseup", handleMouseUp)
	}

	function handleMouseUp() {
		// Remove listeners
		document.removeEventListener("mouseup", handleMouseUp)
		document.removeEventListener("mousemove", handleMouseMove)
	}

	function showHeader() {
		currentRef.current.style.opacity = "100"
	}

	function hideHeader() {
		currentRef.current.style.opacity = "0"
	}

	function wrapToggleable(value) {
		return disabled ? null : value
	}

	return (
		<div ref={ref} className={clsx(className, "relative")}>
			<Header ref={currentRef} />
			<ProgressContainer ref={rangeRef} onMouseDown={wrapToggleable(handleProgressClick)}>
				<Progress ref={rangeProgressRef} onMouseDown={wrapToggleable(handleMouseDown)} />
			</ProgressContainer>
			{thumb && (
				<Thumb
					ref={thumbRef}
					onMouseEnter={showHeader}
					onMouseLeave={hideHeader}
					onMouseDown={wrapToggleable(handleMouseDown)}
				/>
			)}
		</div>
	)
})

Slider.defaultProps = {
	min: 0,
	thumb: true,
	disabled: false,
	onChange: () => {},
}

export default Slider
