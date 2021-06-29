function isEscapeKey(event) {
  return event.keyCode === 27;
}

function isEnterFocused(event) {
  return event?.target?.focused && event.keyCode === 13;
}

const PrivacyPolicy = ({ closeModal }) => {
  function onEscapeClick(event) {
    if (!isEscapeKey(event) || isEnterFocused) return;
    closeModal();
  }

  return (
    <div className="fixed shadow-inner max-w-6xl md:relative pin-b pin-x align-top m-auto justify-end md:justify-center p-8 bg-secondary-300 md:rounded w-full flex flex-col">
      <span
        className="absolute top-4 right-5 cursor-pointer"
        role="button"
        tabIndex="0"
        onClick={closeModal}
        onKeyDown={onEscapeClick}
      >
        ✖
      </span>
      <h1 className="text-center mt-5 text-3xl">Privacy Policy</h1>
    </div>
  );
};

export default PrivacyPolicy;
