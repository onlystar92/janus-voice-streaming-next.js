import { take } from 'rxjs/operators';
import nextApply from 'util/observable/next-apply';
import { audio$ } from './audio';

const { BehaviorSubject } = require('rxjs');

const settings$ = new BehaviorSubject({
  muted: false,
  deafened: false,
  inputVolume: 1,
  outputVolume: 1,
  inputDevice: 'Default',
  outputDevice: 'Default',
});

const applySetting = nextApply(settings$);

function requestMute(muted) {
  audio$.pipe(take(1)).subscribe(({ switchboardClient }) => {
    switchboardClient.requestConfigUpdate('muted', muted);
  });
}

function setMuted(muted) {
  applySetting({ muted });
}

function requestDeafen(deafened) {
  audio$.pipe(take(1)).subscribe(({ switchboardClient }) => {
    switchboardClient.requestConfigUpdate('deafened', deafened);
  });
}

function setDeafened(deafened) {
  applySetting({ deafened });
}

function setInputVolume(volume) {
  applySetting({ inputVolume: volume });
}

function setOutputVolume(volume) {
  applySetting({ outputVolume: volume });
}

function setInputDevice(inputDevice) {
  applySetting({ inputDevice });
}

function setOutputDevice(outputDevice) {
  applySetting({ outputDevice });
}

export {
  settings$,
  requestMute,
  setMuted,
  requestDeafen,
  setDeafened,
  setInputDevice,
  setInputVolume,
  setOutputDevice,
  setOutputVolume,
};
