import { audio$ } from 'observables/audio';
import { setRoom } from 'observables/user';
import { isNil, not } from 'ramda';
import nextApply from 'util/observable/next-apply';
import takeLatest from 'util/observable/take-latest';

async function handleRoomChange(room) {
  console.info('Handling room change');
  const { mediaPublisher, mediaListener, dataChannel } = await takeLatest(
    audio$
  );

  if (dataChannel.isOpen()) {
    console.info('Closing data channel');
    await dataChannel.close();
  }

  if (mediaPublisher.isRunning()) {
    console.info('Stopping media publisher');
    await mediaPublisher.stop();
  }

  if (mediaListener.isRunning()) {
    console.info('Stopping media listener');
    await mediaListener.stop();
  }

  console.info('Assigning new room to user');
  setRoom(room);

  // Ignore room change if new room is null
  if (not(isNil(room))) {
    console.info('Starting media publisher on room:', room);
    const peerConnection = await mediaPublisher.start(room);
    console.info('Starting media listener:', room);
    await mediaListener.start(room);

    console.info('Opening data channel on room:', room);
    console.info('Peer connection:', peerConnection);
    await dataChannel.open(peerConnection);
  }

  nextApply(audio$, { mediaPublisher, mediaListener, dataChannel });
}

export default handleRoomChange;
