import { BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';
import { appendIfNotPresent, remove } from 'util/array';
import nextApply from 'util/observable/next-apply';

const audio$ = new BehaviorSubject({
  session: null,
  switchboardClient: null,
  dataChannel: null,
  mediaPublisher: null,
  mediaListener: null,
  audioContext: null,
  audioMeter: null,
  pendingListen: [],
  listening: [],
});

const applyAudio = nextApply(audio$);

function setSession(session) {
  applyAudio({ session });
}

function setSwitchboardClient(switchboardClient) {
  applyAudio({ switchboardClient });
}

function setMediaPublisher(mediaPublisher) {
  applyAudio({ mediaPublisher });
}

function setMediaListener(mediaListener) {
  applyAudio({ mediaListener });
}

function setDataChannel(dataChannel) {
  applyAudio({ dataChannel });
}

function setAudioContext(audioContext) {
  applyAudio({ audioContext });
}

function setAudioMeter(audioMeter) {
  applyAudio({ audioMeter });
}

function addListening(uuid) {
  audio$.pipe(take(1)).subscribe(({ listening }) => {
    const newListening = appendIfNotPresent(uuid, listening);
    applyAudio({ listening: newListening });
  });
}

function removeListening(uuid) {
  audio$.pipe(take(1)).subscribe(({ listening }) => {
    const newListening = remove(uuid, listening);
    applyAudio({ listening: newListening });
  });
}

function addPending(uuid) {
  audio$.pipe(take(1)).subscribe(({ pendingListen }) => {
    const newPending = appendIfNotPresent(uuid, pendingListen);
    applyAudio({ pendingListen: newPending });
  });
}

function removePending(uuid) {
  audio$.pipe(take(1)).subscribe(({ pendingListen }) => {
    const newPending = remove(uuid, pendingListen);
    applyAudio({ pendingListen: newPending });
  });
}

export {
  audio$,
  addListening,
  removeListening,
  addPending,
  removePending,
  setSession,
  setSwitchboardClient,
  setMediaPublisher,
  setMediaListener,
  setDataChannel,
  setAudioContext,
  setAudioMeter,
};
