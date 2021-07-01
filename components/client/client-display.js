import { memo, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import hark from 'hark';
import { equals, isNil, prop } from 'ramda';
import { audio$ } from 'observables/audio';
import { user$ } from 'observables/user';
import { settings$ } from 'observables/settings';
import { distinctUntilChanged, map, pluck } from 'rxjs/operators';
import { useObservable } from 'rxjs-hooks';
import { findDeviceByLabel } from 'util/audio';
import Slider from '../slider';
import ClientInput from './client-input';
import ClientAvatar from './client-avatar';
import ClientStatus from './client-status';

const activeMuted$ = settings$.pipe(map(prop('muted')), distinctUntilChanged());
const activeUUID$ = user$.pipe(map(prop('uuid')), distinctUntilChanged());
const audioContext$ = audio$.pipe(
  map(prop('audioContext')),
  distinctUntilChanged()
);
const outputVolume$ = settings$.pipe(
  pluck('outputVolume'),
  distinctUntilChanged()
);
const outputDevice$ = settings$.pipe(
  pluck('outputDevice'),
  distinctUntilChanged()
);

function ClientDisplay({ client, closeSession }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showStatus, setShowStatus] = useState(true);
  const activeUUID = useObservable(() => activeUUID$);
  const activeMuted = useObservable(() => activeMuted$, false);
  const audioContext = useObservable(() => audioContext$, false);
  const container = useRef();
  const audioRef = useRef();
  const analyzerRef = useRef();

  // async function analyzeStream() {
  //   if (analyzerRef.current) clearTimeout(analyzerRef.current);
  //   const { username } = client;
  //   console.info(`Analyzer for client ${username}`);
  //   console.info(`Duration: ${audioRef.current?.duration}`);
  //   console.info(`Paused: ${audioRef.current?.paused}`);
  //   console.info(`Context state ${audioContext.state}`);
  //   analyzerRef.current = setTimeout(analyzeStream, 10000);
  // }

  // Handle stream change
  useEffect(() => {
    const { stream } = client;

    if (!audioContext || !stream) return undefined;

    console.info('Started speech analyzer');
    const options = {};
    const speechEvents = hark(stream, options);

    speechEvents.on('speaking', () => {
      setIsSpeaking(true);
    });

    speechEvents.on('stopped_speaking', () => {
      setIsSpeaking(false);
    });

    console.info('Updating audio stream');
    console.info('Audio ref:', audioRef.current);
    if (!audioRef.current) return undefined;
    console.info('Playing audio stream:', stream);
    audioRef.current.srcObject = stream;

    console.info('Analyzing stream');
    // analyzeStream();

    if (audioContext.state === 'suspended') {
      console.info('Resuming audio context');
      audioContext.resume();
    }

    return () => {
      // Stop analyzer
      clearTimeout(analyzerRef.current);
    };
  }, [client.stream, audioContext]);

  useEffect(() => {
    // Handle master volume change
    const outputVolumeSubscription = outputVolume$.subscribe((outputVolume) => {
      if (isNil(audioRef.current)) return;
      console.info('Changing output volume to:', outputVolume);
      audioRef.current.volume = outputVolume;
    });

    // Handle output device change
    const outputDeviceSubscription = outputDevice$.subscribe(
      async (outputDevice) => {
        if (isNil(outputDevice)) return;
        let device = await findDeviceByLabel(outputDevice);

        if (!device || !device.deviceId) {
          const [firstDevice] = await navigator.mediaDevices.enumerateDevices();
          if (!firstDevice || !firstDevice.deviceId) return;
          device = firstDevice;
        }

        if (isNil(audioRef.current)) return;
        await audioRef.current.setSinkId(device.deviceId);
      }
    );

    return () => {
      // Unsubscribe
      outputVolumeSubscription.unsubscribe();
      outputDeviceSubscription.unsubscribe();
    };
  }, []);

  const isUser = equals(activeUUID, client.uuid);
  const isMuted = isUser ? activeMuted : client.muted;
  const clientType = isUser ? 'self' : 'peer';

  useEffect(() => {
    if (!container) return;
    setTimeout(() => setShowStatus(false), 10000);
  }, [isUser]);

  function toggleVolumeSlider() {
    if (!isUser) return;
    setShowVolumeSlider(!showVolumeSlider);
  }

  return (
    <div
      ref={container}
      className={clsx(
        'mt-2 z-10 p-2 justify-between items-center rounded-lg shadow-sm bg-primary-200',
        'sm:m-0',
        'lg:px-4',
        {
          'fixed left-12 bottom-8 w-96': isUser,
          'ring-2 ring-green-700':
            (isUser && !isMuted && isSpeaking) || (!isUser && isSpeaking),
        }
      )}
      onMouseEnter={() => setShowStatus(true)}
      onMouseLeave={() => setShowStatus(false)}
    >
      {isUser && (
        <div
          className={clsx('block transition-all duration-75', {
            'opacity-100': showStatus,
            'opacity-0': !showStatus,
          })}
        >
          <ClientStatus />
        </div>
      )}
      <div className="flex items-center">
        <div className="flex items-center flex-1 min-w-0">
          <ClientAvatar
            client={client}
            clientType={clientType}
            onClick={toggleVolumeSlider}
          />
          <span
            className={clsx(
              'px-2 py-1 ml-2',
              'text-sm font-bold rounded-md',
              'xl:px-4 xl:py-2',
              'xl:rounded-xl xl:px-4 xl:py-2 xl:text-lg',
              'truncate min-w-0',
              {
                'bg-primary-text text-secondary-text ': clientType === 'self',
                'bg-secondary-200 text-primary-text': clientType === 'peer',
              }
            )}
          >
            {client.username}
          </span>
        </div>
        {showVolumeSlider ? (
          <div className="w-56 text-white">
            <Slider variant="line" initial={100} min={0} max={100} />
          </div>
        ) : (
          <ClientInput
            client={client}
            type={clientType}
            closeSession={closeSession}
          />
        )}
      </div>
      {clientType === 'peer' && (
        <audio
          ref={audioRef}
          className="fixed hidden w-0 h-0"
          controls={false}
          muted
          autoPlay
          playsInline
        />
      )}
    </div>
  );
}

export default memo(ClientDisplay);
