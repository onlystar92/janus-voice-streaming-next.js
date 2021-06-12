const TermsOfServiceModal = ({ closeModal }) => {
	return (
		<div className="fixed shadow-inner max-w-6xl md:relative pin-b pin-x align-top m-auto justify-end md:justify-center p-8 bg-secondary-300 md:rounded w-full flex flex-col">
			<span className="absolute top-4 right-5 cursor-pointer" onClick={closeModal}>
				✖
			</span>
			<h1 className="text-center mt-5 text-3xl">Terms of service</h1>
		</div>
	)
}

export default TermsOfServiceModal
