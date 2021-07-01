import { prop, pick, propEq, find } from 'ramda';
import {
  clients$,
  getActiveClient,
  removeClient,
  softRemove,
  updateClient,
} from 'observables/clients';
import { settings$ } from 'observables/settings';
import { distinctUntilChanged, map, pluck, take } from 'rxjs/operators';
import { audio$, removeListening } from 'observables/audio';
import { user$ } from 'observables/user';
import { forkJoin } from 'rxjs';
import { listenFeed, publishAudioTracks } from './janus/video-room';
import { findDeviceByLabel, getDeviceMediaStream } from './audio';
import takeLatest from './observable/take-latest';

const userData$ = user$.pipe(take(1), map(pick(['uuid', 'token'])));
const audioSession$ = audio$.pipe(take(1), map(prop('session')));

const inputDevice$ = settings$.pipe(
  map(prop('inputDevice')),
  distinctUntilChanged()
);
const muted$ = settings$.pipe(map(prop('muted')), distinctUntilChanged());

const mediaListener$ = audio$.pipe(take(1), pluck('mediaListener'));
const audioContext$ = audio$.pipe(take(1), pluck('audioContext'));

function replaceAudioStream(trackSender, stream) {
  const audioTrack = stream.getAudioTracks()[0];
  trackSender.replaceTrack(audioTrack);
}

function subscribeToInputDeviceChange(trackSender) {
  return inputDevice$.subscribe(async ({ preferredInput }) => {
    const device = await findDeviceByLabel(preferredInput);

    if (!device) {
      console.info('Ignoring input device update. Device is null.');
      return;
    }

    const stream = await getDeviceMediaStream(device);

    if (!stream) {
      console.error('Failed to retrieve stream for device: ', device.label);
      return;
    }

    await replaceAudioStream(trackSender, stream);
    console.info('Changed input device to:', device.label);

    console.info('Assigning new audio stream');
    const activeClient = await takeLatest(getActiveClient());
    updateClient(activeClient.uuid, { stream });
  });
}

async function publishClientMedia(room) {
  console.info('Publishing client media');
  const [userData, audioSession] = await takeLatest(
    forkJoin([userData$, audioSession$])
  );
  const { publisherId, peerConnection, trackSender } = await publishAudioTracks(
    userData,
    audioSession,
    room
  );
  const inputDeviceSubscription = subscribeToInputDeviceChange(trackSender);
  const muteSubscription = muted$.subscribe((muted) => {
    console.info('Muted:', muted);
    // eslint-disable-next-line no-param-reassign
    trackSender.track.enabled = !muted;
  });

  // Handle connection state
  peerConnection.onconnectionstatechange = () => {
    switch (peerConnection.connectionState) {
      case 'connected':
        console.info('User publishing stream:', publisherId);
        break;
      case 'disconnected':
        console.info('User media stream disconnected');
        break;
      case 'failed':
        console.info('Failed to publish audio stream');
        break;
      case 'closed':
        console.info('Connection closed');
        inputDeviceSubscription.unsubscribe();
        muteSubscription.unsubscribe();
        break;
      default:
        break;
    }
  };

  return peerConnection;
}

const audioPhysicsConfig = {
  directionalAudio: true,
  panningModel: 'HRTF', // human head
  distanceModel: 'inverse', // inverse, linear, or exponential
  maxDistance: 80, // max distance for audio rolloff
  rolloffFactor: 0.5, // higher means faster volume loss
  refDistance: 1, // reference distance for reducing volume
};

function findClient(uuid) {
  return takeLatest(clients$.pipe(take(1), map(find(propEq('uuid', uuid)))));
}

async function listenToFeed(room, feed) {
  let clientId;

  const session = await takeLatest(audioSession$);
  const { peerConnection } = await listenFeed(session, room, feed);

  peerConnection.onconnectionstatechange = () => {
    switch (peerConnection.connectionState) {
      case 'connected':
        console.info('Connected to feed:', feed);
        break;
      case 'disconnected':
      case 'failed':
        console.info('Disconnected from feed:', feed);
        softRemove(clientId);
        break;
      case 'closed':
        console.info('Closed connection to feed:', feed);
        removeClient(clientId);
        removeListening(clientId);
        break;
      default:
        break;
    }
  };

  // Handle track event
  peerConnection.ontrack = async (event) => {
    const mediaListener = await takeLatest(mediaListener$);

    // Find participant in room
    const participant = mediaListener.findParticipant(feed);
    if (!participant) {
      console.info('Failed to find participant with feed:', feed);
      return;
    }
    console.info('Found participant:', participant);

    // Cache client id
    const uuid = participant.display;
    clientId = uuid;

    // Find peer client
    const peerClient = await findClient(uuid);
    if (!peerClient) {
      console.info('Could not find peer client with uuid:', uuid);
      return;
    }
    console.info('Found peer client:', peerClient);

    // Create panner node
    console.info(`Initializing ${peerClient.username}'s panner node`);
    const stream = event.streams[0];
    const audioContext = await takeLatest(audioContext$);
    const audioSource = audioContext.createMediaStreamSource(stream);
    const node = new PannerNode(audioContext, audioPhysicsConfig);

    // default position is zero, facing south.
    // note that for default cone values, orientation of speaker
    // isn't significant
    node.positionX.value = 0;
    node.positionY.value = 0;
    node.positionZ.value = 0;

    // Hook everything up
    audioSource.connect(node);
    node.connect(audioContext.destination);
    console.info(
      `Connected ${peerClient.username}'s panner node to audioContext`
    );

    // Assign node and stream to client
    updateClient(uuid, { node, stream });
    console.info(
      `Assigned ${peerClient.username}'s client a PannerNode and a stream`
    );
  };

  return peerConnection;
}

export { publishClientMedia, listenToFeed };
