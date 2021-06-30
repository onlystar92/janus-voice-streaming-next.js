import { audio$ } from 'observables/audio';
import { isNil } from 'ramda';
import { pluck, take } from 'rxjs/operators';
import takeLatest from 'util/observable/take-latest';
import { publishClientMedia } from 'util/voice-client';

const audioSession$ = audio$.pipe(take(1), pluck('session'));

export default function RoomMediaPublisher() {
  let peerConnection;

  async function start(room) {
    peerConnection = await publishClientMedia(room);
    return peerConnection;
  }

  async function stop() {
    const session = await takeLatest(audioSession$);
    console.info('Room handle:', session);
    const roomHandle = await session.videoRoom().defaultHandle();
    console.info('Room handle:', roomHandle);

    // Stop publishing audio
    if (roomHandle && roomHandle.isConnected()) {
      await roomHandle.leave();
    }

    peerConnection = null;
  }

  function isRunning() {
    return !isNil(peerConnection);
  }

  function getConnection() {
    return peerConnection;
  }

  return { start, stop, isRunning, getConnection };
}
