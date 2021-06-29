import {
  compose,
  concat,
  isNil,
  mergeLeft,
  mergeRight,
  not,
  omit,
  partition,
  propEq,
} from 'ramda';
import { asyncScheduler, BehaviorSubject, forkJoin } from 'rxjs';
import { map, pluck, take } from 'rxjs/operators';
import { user$ } from './user';

// matchesClientUUID :: [BehaviorSubject] => Boolean
const matchesClientUUID = (uuid) => propEq('uuid', uuid);

const clients$ = new BehaviorSubject([]);

clients$.subscribe((clients) => {
  console.info('Clients changed:', clients);
});

// Default options to use when creating a client
const defaultClientOptions = {
  uuid: undefined,
  username: undefined,
  room: undefined,

  stream: undefined,
  node: undefined,

  volume: 100,
  talking: false,
  muted: false,
};

/**
 * Creates a new client object that is then wrapped in a {@link BehaviorSubject}.
 * If an option is not provided, it will default to the one given in {@link defaultClientOptions}.
 * @param {object} options Options to use generate client with
 * @returns
 */
function createClient(options = {}) {
  return mergeRight(defaultClientOptions, options);
}

function updateClient(uuid, options) {
  clients$.pipe(take(1)).subscribe((clients) => {
    const [match, notMatch] = partition(matchesClientUUID(uuid), clients);
    const newClients = concat(notMatch, match.map(mergeLeft(options)));
    clients$.next(newClients);
  });
}

/**
 * Adds the client provided to the client list.
 * The client provided must have been generated using {@link createClient}.
 * @param {object} client Client to add
 */
function addClient(client = {}) {
  clients$.pipe(take(1)).subscribe((clients) => {
    const found = clients.find((current) => current.uuid === client.uuid);
    let newClients;

    if (found && found.removed) {
      const newFoundClient = mergeLeft(client, omit(['removed'], found));
      const filteredClients = clients.filter(
        (current) => current.uuid !== client.uuid
      );
      newClients = [...filteredClients, newFoundClient];
    } else {
      newClients = [...clients, createClient(client)];
    }

    clients$.next(newClients);
  });
}

/**
 * Removes any client from the client list who's uuid matches
 * the one provided
 * @param {string} uuid Id of the client to remove
 */
function removeClient(uuid) {
  clients$.pipe(take(1)).subscribe((clients) => {
    const newClients = clients.filter(compose(not, matchesClientUUID(uuid)));

    // Stop stream tracks
    const removed = clients.find(matchesClientUUID(uuid));
    if (removed) {
      removed.stream.getTracks().forEach((track) => track.stop());
    }

    clients$.next(newClients);
  });
}

function softRemove(uuid) {
  clients$.pipe(take(1)).subscribe((clients) => {
    const [removed, notRemoved] = partition(matchesClientUUID(uuid), clients);
    const newClients = concat(
      notRemoved,
      removed.map((current) => ({
        ...current,
        removed: true,
      }))
    );
    clients$.next(newClients);
  });
  asyncScheduler.schedule(() => {
    clients$.pipe(take(1)).subscribe((clients) => {
      const found = clients.find((current) => current.uuid === uuid);
      if (isNil(found) || isNil(found.removed)) return;
      removeClient(uuid);
    });
  }, 10 * 1000);
}

/**
 * Removes all clients from the client list except the active client
 */
function clearPeerClients() {
  const activeUUID$ = user$.pipe(take(1), pluck('uuid'));
  const currentClients$ = clients$.pipe(take(1));
  forkJoin([activeUUID$, currentClients$]).subscribe(
    ([activeUUID, clients]) => {
      const newClients = clients.filter(matchesClientUUID(activeUUID));
      clients$.next(newClients);
    }
  );
}

/**
 * Retrieves the client currently active in this session
 * @returns Active client
 */
function getActiveClient() {
  const currentClients$ = clients$.pipe(take(1));
  const currentUser$ = user$.pipe(take(1));
  return forkJoin([currentClients$, currentUser$]).pipe(
    map(([clients, user]) => clients.find(matchesClientUUID(user.uuid))),
    take(1)
  );
}

export {
  clients$,
  createClient,
  addClient,
  updateClient,
  removeClient,
  softRemove,
  clearPeerClients,
  getActiveClient,
};
