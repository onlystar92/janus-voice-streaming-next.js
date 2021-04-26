import clsx from "clsx"
import Volume from "icons/Volume"
import { forwardRef, useRef, useState } from "react"

/**
 * Maps the progress paramater from the minProgress-maxProgress range to the minValue-maxValue range
 * @param {*} progress value to map
 * @param {*} minProgress minimum value expected from the progress parameter
 * @param {*} maxProgress maximum value expected from the progress parameter
 * @param {*} minValue minimum value expected from mapping the progress
 * @param {*} maxValue maximum value expected from mapping the progress
 */
const mapProgressToValue = (progress, minProgress, maxProgress, minValue, maxValue) => {
	const leftSpan = maxProgress - minProgress
	const rightSpan = maxValue - minValue
	const valueScaled = parseFloat(progress - minValue) / parseFloat(leftSpan)
	return valueScaled * rightSpan + minValue
}

/**
 * Calculates the progress based on the clientX parameter and the width of the thumbSlider
 * @param {*} clientX the current position in the x-axis of the client's mouse
 * @param {*} thumbSlider a reference to the thumb slider element
 */
const calculateProgress = (clientX, thumbSlider) => {
	const thumbSliderBound = thumbSlider.getBoundingClientRect()
	const shiftX = clientX - thumbSliderBound.width
	const leftMargin = thumbSliderBound.left - thumbSlider.offsetLeft
	return thumbSliderBound.width + shiftX - leftMargin
}

const Thumb = forwardRef(({ onMouseDown }, ref) => (
	<div
		ref={ref}
		className="absolute -mt-2 bg-secondary-200 right-0 rounded-full"
		onMouseDown={onMouseDown}
	>
		<Volume className="w-8 h-8 py-2" />
	</div>
))

const ThumbSlider = forwardRef(({ progress, children }, ref) => (
	<div
		ref={ref}
		className="absolute w-full h-4 bg-primary-100 rounded-full cursor-ew-resize"
		style={{ width: `${progress}%` }}
	>
		{children}
	</div>
))

const Slider = ({ className, onChange, min = 0, max = 1 }) => {
	const [value, setValue] = useState()
	const thumb = useRef()
	const thumbSlider = useRef()
	const slider = useRef()

	const handleSliderMouseDown = event => {
		handleMouseMove(event)
		handleMouseDown(event)
	}

	const handleMouseDown = event => {
		event.preventDefault()

		// Add event listeners
		document.addEventListener("mousemove", handleMouseMove)
		document.addEventListener("mouseup", handleMouseUp)
	}

	const handleMouseMove = event => {
		const maxProgress = slider.current.offsetWidth
		const minProgress = thumb.current.getBoundingClientRect().width
		const newProgress = calculateProgress(event.clientX, thumbSlider.current)
		const value = mapProgressToValue(newProgress, minProgress, maxProgress, min, max)

		// Set newly calculated value
		setValue(value)

		if (!onChange) {
			return
		}

		onChange(value)
	}

	const handleMouseUp = () => {
		document.removeEventListener("mouseup", handleMouseUp)
		document.removeEventListener("mousemove", handleMouseMove)
	}

	return (
		<div
			ref={slider}
			className={clsx(className, "h-4 bg-white bg-opacity-60 rounded-full cursor-ew-resize")}
			onMouseDown={handleSliderMouseDown}
		>
			<div className="relative">
				<ThumbSlider ref={thumbSlider} progress={value}></ThumbSlider>
				<Thumb ref={thumb} onMouseDown={handleMouseDown} />
			</div>
		</div>
	)
}

export default Slider
