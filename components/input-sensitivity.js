import { isNil, prop } from 'ramda';
import { useEffect, useRef, useState } from 'react';
import { audio$ } from 'observables/audio';
import { pluck } from 'rxjs/operators';
import { useObservable } from 'rxjs-hooks';
import Slider from './slider';

const audioMeter$ = audio$.pipe(pluck('audioMeter'));

function SensitivityIndicator() {
  const audioMeter = useObservable(() => audioMeter$);
  const [sensitivity, setSensitivity] = useState(0);
  const listenTask = useRef();

  function listenToVolumeChanges(delay, meter) {
    if (isNil(prop('volume', meter))) {
      return clearTimeout(listenTask.current);
    }

    if (sensitivity === meter.volume) {
      return setTimeout(() => listenToVolumeChanges(delay), delay);
    }

    setSensitivity(meter.volume);
    return setTimeout(() => listenToVolumeChanges(delay), delay);
  }

  useEffect(() => {
    if (!audioMeter) return undefined;

    // Clear timeout of previous task
    if (listenTask.current) {
      clearTimeout(listenTask.current);
    }

    // Assign new task
    listenTask.current = listenToVolumeChanges(20, audioMeter);
    return () => {
      clearTimeout(listenTask.current);
    };
  }, [audioMeter]);

  return (
    <Slider
      className="mt-2"
      initial={sensitivity * 100 * 1.4}
      min={0}
      max={100}
      thumb={false}
      disabled
    />
  );
}

export default SensitivityIndicator;
