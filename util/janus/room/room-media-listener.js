import {
  includes,
  not,
  prop,
  curry,
  isNil,
  isEmpty,
  propEq,
  find,
} from 'ramda';
import { clearPeerClients } from 'observables/clients';
import { user$ } from 'observables/user';
import { addListening, audio$, removePending } from 'observables/audio';
import { from, interval } from 'rxjs';
import {
  combineLatestWith,
  map,
  mergeMap,
  pluck,
  take,
  timeout,
} from 'rxjs/operators';
import { listenToFeed } from 'util/voice-client';
import { listParticipants } from '../video-room';

const notListeningTo = (uuid, peerList) =>
  includes(uuid, peerList.pendingListen) &&
  not(includes(uuid, peerList.listening));

const filterParticipants = (participants, uuid, peerList) =>
  participants.filter(({ display: participantUUID }) =>
    // not(equals(uuid, participantUUID)) &&
    notListeningTo(participantUUID, peerList)
  );

const listenToParticipant = curry(async (room, participant) => {
  const uuid = participant.display;

  // Remove from pending and add to listening
  removePending(uuid);
  addListening(uuid);

  console.info(`Listening to participant ${uuid} in room ${room}`);
  const clientconnection = await listenToFeed(room, participant.id);
  clientconnection.ondatachannel = console.log;
});

const activeUUID$ = user$.pipe(pluck('uuid'));
const peerList$ = audio$.pipe(
  map(({ listening, pendingListen }) => ({
    listening,
    pendingListen,
  }))
);

function fetchNewParticipants(room) {
  return () =>
    from(listParticipants(room)).pipe(
      map(prop('participants')),
      combineLatestWith([activeUUID$.pipe(take(1)), peerList$.pipe(take(1))]),
      map(([participants, activeUUID, peerList]) =>
        filterParticipants(participants, activeUUID, peerList)
      )
    );
}

export default function RoomMediaListener() {
  let listener;
  let localParticipants = [];

  async function start(room) {
    listener = interval(2000)
      .pipe(mergeMap(fetchNewParticipants(room)), timeout({ each: 10000 }))
      .subscribe({
        next: (participants) => {
          // Update local participants
          localParticipants = participants;

          // Ignore if participants array is empty
          if (isEmpty(localParticipants)) return;

          console.info('Listening to particpants:', participants);
          participants.forEach(listenToParticipant(room));
        },
        error: (error) => {
          console.info('Error retreiving new participants:', error);
        },
      });
  }

  function stop() {
    if (listener) {
      listener.unsubscribe();
      listener = null;
    }

    // Clear peer clients
    clearPeerClients();
  }

  function findParticipant(feed) {
    return find(propEq('id', feed), localParticipants);
  }

  function isRunning() {
    return !isNil(listener);
  }

  return { start, stop, findParticipant, isRunning };
}
