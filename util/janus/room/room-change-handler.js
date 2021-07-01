import { audio$ } from 'observables/audio';
import { setRoom } from 'observables/user';
import { includes, isNil, not, props } from 'ramda';
import { delay, map, retryWhen, take } from 'rxjs/operators';

async function handleRoomChange(room) {
  console.info('Handling room change');
  setRoom(room);

  audio$
    .pipe(
      map(props(['mediaPublisher', 'mediaListener', 'dataChannel'])),
      map((roomMedia) => {
        if (includes(null, roomMedia)) throw Error('Null room media');
        return roomMedia;
      }),
      retryWhen((errors) => errors.pipe(take(4), delay(1000))),
      take(1)
    )
    .subscribe(async ([mediaPublisher, mediaListener, dataChannel]) => {
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

      // Ignore room change if new room is null
      if (not(isNil(room))) {
        console.info('Starting media listener an publisher on room:', room);
        const peerConnection = await mediaPublisher.start(room);
        await mediaListener.start(room);

        console.info('Opening data channel on room:', room);
        await dataChannel.open(peerConnection);
      }
    });
}

export default handleRoomChange;
