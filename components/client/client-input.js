import React, { useRef, useState } from 'react';
import { pick, propOr } from 'ramda';
import clsx from 'clsx';
import Slider from 'components/slider';
import Volume from 'icons/Volume';
import MicrophoneMuted from 'icons/MicrophoneMuted';
import VolumeMuted from 'icons/VolumeMuted';
import Microphone from 'icons/Microphone';
import CloseSession from 'icons/CloseSession';
import { distinct, map } from 'rxjs/operators';
import { requestDeafen, requestMute, settings$ } from 'observables/settings';
import { updateClient } from 'observables/clients';
import { useObservable } from 'rxjs-hooks';

function PeerInput({ client }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef();
  const sliderRef = useRef();

  function handlePeerVolumeChange(volume) {
    updateClient(client.uuid, { volume });
  }

  return (
    <div
      ref={containerRef}
      className={clsx(
        'w-11 flex items-center justify-between',
        'text-primary-text bg-secondary-200 rounded-full',
        'transition-all duration-150 ease-in-out',
        { 'w-1/2': open }
      )}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div className="p-3">
        <Volume className="h-3 md:h-4 lg:h-5" />
      </div>
      <Slider
        ref={sliderRef}
        className={clsx({
          'opacity-0': !open,
          'w-full opacity-100 mr-3': open,
        })}
        initial={propOr(100, 'volume', client)}
        min={0}
        max={100}
        thumb={false}
        onChange={handlePeerVolumeChange}
      />
    </div>
  );
}

const audioSettings$ = settings$.pipe(
  map(pick(['muted', 'deafened'])),
  distinct()
);

const defaultAudioSettings = {
  muted: false,
  deafened: false,
};

function SelfInput({ closeSession }) {
  const audioSettings = useObservable(
    () => audioSettings$,
    defaultAudioSettings
  );

  function handleMute() {
    requestMute(!audioSettings.muted);
  }

  function handelDeafen() {
    requestDeafen(!audioSettings.deafened);
  }

  const MuteIcon = audioSettings.muted ? MicrophoneMuted : Microphone;
  const DefenIcon = audioSettings.deafened ? VolumeMuted : Volume;

  return (
    <div className="flex flex-nowrap ml-2">
      <button
        className={clsx(
          'p-2 md:p-2 lg:p-3',
          'rounded-full outline-none transition-all ease-linear focus:outline-none',
          {
            'text-primary-text bg-red-500': audioSettings.deafened,
            'bg-primary-text text-secondary-text': !audioSettings.deafened,
          }
        )}
        type="button"
        onClick={handelDeafen}
      >
        <DefenIcon className="h-3 md:h-4 lg:h-5" />
      </button>
      <button
        className={clsx(
          'p-2 md:p-2 lg:p-3 mx-2',
          'rounded-full outline-none transition-all ease-linear focus:outline-none',
          {
            'text-primary-text bg-red-500': audioSettings.muted,
            'bg-primary-text text-secondary-text': !audioSettings.muted,
          }
        )}
        type="button"
        onClick={handleMute}
      >
        <MuteIcon className="h-3 md:h-4 lg:h-5" />
      </button>
      <button
        className="p-2 md:p-2 lg:p-3 rounded-full outline-none transition-all ease-linear focus:outline-none bg-red-500 text-secondary-text"
        onClick={closeSession}
        type="button"
      >
        <CloseSession className="h-3 md:h-4 lg:h-5" />
      </button>
    </div>
  );
}

function ClientInput({ client, type = 'peer', closeSession }) {
  let InputComponent;

  switch (type) {
    case 'self':
      InputComponent = SelfInput;
      break;
    case 'peer':
    default:
      InputComponent = PeerInput;
      break;
  }

  return <InputComponent client={client} closeSession={closeSession} />;
}

export default ClientInput;
