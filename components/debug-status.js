import React from 'react';
import CloseSession from 'icons/CloseSession';
import Timer from './timer';

const DebugStatus = ({ closeSession }) => (
  <div className="fixed bottom-8 right-12 z-50 mt-2 p-2 px-2 flex flex-col justify-center items-center rounded-lg shadow-sm bg-primary-200 sm:m-0 lg:px-4">
    <button
      className="p-2 md:p-2 lg:p-3 rounded-full outline-none transition-all ease-linear focus:outline-none bg-red-500 text-secondary-text"
      onClick={closeSession}
      type="button"
    >
      <CloseSession className="h-3 md:h-4 lg:h-5" />
    </button>
    <Timer />
  </div>
);

export default DebugStatus;
