import { useEffect, useState } from 'react';
import { pick, pluck, propOr } from 'ramda';
import { distinct, map } from 'rxjs/operators';
import {
  settings$,
  setInputDevice,
  setInputVolume,
  setOutputVolume,
  setOutputDevice,
} from 'observables/settings';
import Select from 'components/select';
import Slider from 'components/slider';
import NavigationArrow from 'icons/NavigationArrow';
import { useObservable } from 'rxjs-hooks';
import SensitivityIndicator from './input-sensitivity';

const findMediaDevicesByKind = async (kind) => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert('getUserMedia() is not supported by your browser');
  }

  // Request access to audio
  await navigator.mediaDevices.getUserMedia({ audio: true });

  // Filter devices by kind
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter((device) => device.kind === kind);
};

async function findInputDevices() {
  const inputDevices = await findMediaDevicesByKind('audioinput');
  return pluck('label', inputDevices);
}

async function findOutputDevices() {
  const outputDevices = await findMediaDevicesByKind('audiooutput');
  return pluck('label', outputDevices);
}

function Divider() {
  return (
    <div className="mt-2 border border-solid border-primary-100 rounded-lg" />
  );
}

const devicesPipe$ = settings$.pipe(
  map(pick(['inputDevice', 'outputDevice'])),
  distinct()
);

function SettingsModal() {
  const devices = useObservable(() => devicesPipe$);
  const [inputDevices, setInputDevices] = useState(['Default']);
  const [outputDevices, setOutputDevices] = useState(['Default']);

  useEffect(() => {
    async function fetchAudioDevices() {
      const foundInputs = await findInputDevices();
      const foundOutputs = await findOutputDevices();
      setInputDevices((previousInputs) => [...previousInputs, ...foundInputs]);
      setOutputDevices((previousOutputs) => [
        ...previousOutputs,
        ...foundOutputs,
      ]);
    }

    fetchAudioDevices();
  }, []);

  function handleOutputVolumeChange(volume) {
    setOutputVolume(volume);
  }

  function handleInputVolumeChange(volume) {
    setInputVolume(volume);
  }

  function handleInputSelect(device) {
    setInputDevice(device);
  }

  function handleOutputSelect(device) {
    setOutputDevice(device);
  }

  return (
    <div className="relative top-4">
      <NavigationArrow className="absolute h-8 w-8 -top-4 right-2 fill-current text-secondary-300" />
      <div className="p-4 text-primary-text bg-secondary-300 rounded-xl select-none">
        <span className="text-2xl font-bold">Audio Settings</span>
        <Divider />
        <div className="flex flex-col font-semibold">
          <div className="mt-4">
            <span>Master Volume</span>
            <Slider
              className="mt-2"
              initial={100}
              min={0}
              max={100}
              onChange={handleOutputVolumeChange}
            />
          </div>
          <div className="mt-4">
            <span>Input Volume</span>
            <Slider
              className="mt-2"
              initial={100}
              min={0}
              max={100}
              onChange={handleInputVolumeChange}
            />
          </div>
          <div className="mt-4">
            <span>Output Device</span>
            <Select
              className="mt-2"
              selected={propOr(outputDevices[0], 'outputDevice', devices)}
              values={outputDevices}
              onSelect={handleOutputSelect}
            />
          </div>
          <div className="mt-4">
            <span>Input Device</span>
            <Select
              className="mt-2"
              selected={propOr(inputDevices[0], 'inputDevice', devices)}
              values={inputDevices}
              onSelect={handleInputSelect}
            />
          </div>
        </div>
        <div className="mt-4">
          <Divider />
        </div>
        <div className="flex flex-col font-semibold">
          <div className="mt-4">
            <span>Input Sensitivity</span>
            <SensitivityIndicator />
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
