import { useRef, useState } from "react"
import ChevronDown from "@icons/ChevronDown"
import clsx from "clsx"

const Option = ({ value, onClick, isSelected, isLast }) => (
	<span
		className={clsx("w-full p-2 text-accent-text", {
			"bg-secondary-100 hover:bg-primary-300": !isSelected,
			"bg-primary-200": isSelected,
			"rounded-b-md": isLast,
		})}
		onClick={onClick}
	>
		{value}
	</span>
)

const OptionList = ({ className, selected, values, onClick }) => (
	<div className={clsx(className, "flex flex-col")}>
		{values.map((value, index) => (
			<Option
				key={index}
				value={value}
				onClick={onClick}
				isSelected={selected === value}
				isLast={index === values.length - 1}
			/>
		))}
	</div>
)

const Select = ({ className, values, selected, onSelect }) => {
	const [open, setOpen] = useState(false)
	const selector = useRef()

	const handleClickAway = event => {
		if (
			!selector ||
			!selector.current ||
			selector.current.contains(event.target) ||
			selector.current === event.target
		) {
			return
		}

		// Close selector
		// Remove event listener
		setOpen(false)
		document.removeEventListener("mousedown", handleClickAway)
	}

	const handleOpen = event => {
		event.preventDefault()

		if (open) {
			return
		}

		// Set selector to open
		// Add click away listener
		setOpen(true)
		document.addEventListener("mousedown", handleClickAway)
	}

	const handleOptionSelect = event => {
		event.preventDefault()

		// Execute callback
		onSelect(event.target.innerText)
		setOpen(false)
	}

	return (
		<div className={clsx(className, "relative cursor-default")} ref={selector} onClick={handleOpen}>
			<div
				className={clsx(
					"p-2 flex items-center justify-between border-2 border-solid border-transparent transition-colors duration-100 bg-secondary-100 text-accent-text",
					{
						"rounded-md hover:border-primary-300": !open,
						"rounded-t-md border-primary-300 shadow-md": open,
					},
				)}
			>
				<span className="truncate">{selected || values[0]}</span>
				<ChevronDown className="w-6 h-6 cursor-pointer transition-opacity duration-150 opacity-50 hover:opacity-100" />
			</div>
			<OptionList
				className={clsx(
					"absolute border-l-2 border-r-2 border-b-2 rounded-b-md border-primary-300 w-full overflow-hidden z-10",
					{
						"max-h-0 border-opacity-0": !open,
						"max-h-screen shadow-md": open,
					},
				)}
				values={values}
				selected={selected || values[0]}
				onClick={handleOptionSelect}
			/>
		</div>
	)
}

export default Select
