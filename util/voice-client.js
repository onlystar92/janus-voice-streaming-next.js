import { prop, pick, propEq, find } from 'ramda';
import {
  clients$,
  getActiveClient,
  removeClient,
  softRemove,
  updateClient,
} from 'observables/clients';
import { settings$ } from 'observables/settings';
import { distinct, map, pluck, take } from 'rxjs/operators';
import { audio$, removeListening } from 'observables/audio';
import { user$ } from 'observables/user';
import { listenFeed, publishAudioTracks } from './janus/video-room';
import { findDeviceByLabel, getDeviceMediaStream } from './audio';
import takeLatest from './observable/take-latest';

function replaceSenderAudioTracks(sender, stream) {
  const audioTrack = stream.getAudioTracks()[0];
  sender.replaceTrack(audioTrack);
}

const inputDevice$ = settings$.pipe(map(prop('inputDevice')), distinct());
const muted$ = settings$.pipe(map(prop('muted')), distinct());

const userData$ = user$.pipe(take(1), map(pick(['uuid', 'token'])));
const audioSession$ = audio$.pipe(take(1), map(prop('session')));

async function publishClientMedia(room) {
  console.info('Publishing client media');
  const userData = await takeLatest(userData$);
  const audioSession = await takeLatest(audioSession$);

  const { id, peerConnection, trackSender } = await publishAudioTracks(
    userData,
    audioSession,
    room
  );

  const inputDeviceSubscription = inputDevice$.subscribe(
    async ({ preferredInput }) => {
      const device = await findDeviceByLabel(preferredInput);

      if (!device) {
        console.info('Ignoring input device update. Reason: Device is null.');
        return;
      }

      const stream = await getDeviceMediaStream(device);

      console.info('Changed input device to:', device.deviceId);
      await replaceSenderAudioTracks(trackSender, stream);

      console.info('Assigning new audio stream');
      const activeClient = await takeLatest(getActiveClient());
      updateClient(activeClient.uuid, { stream });
    }
  );

  const muteSubscription = muted$.subscribe(({ muted }) => {
    console.info('Muted:', muted);
    trackSender.track.enabled = !muted;
  });

  // Handle connection state
  peerConnection.onconnectionstatechange = () => {
    switch (peerConnection.connectionState) {
      case 'connected':
        console.info('User publishing stream:', id);
        break;
      case 'disconnected':
      case 'failed':
        console.info('User media stream disconnected');
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

const mediaListener$ = audio$.pipe(take(1), pluck('mediaListener'));
const audioContext$ = audio$.pipe(take(1), pluck('audioContext'));

async function listenToFeed(room, feed) {
  let clientId;

  async function onStreamReceive(event) {
    console.info('Finding participant', feed, 'in room');
    const mediaListener = await takeLatest(mediaListener$);
    const participant = mediaListener.findParticipant(feed);
    console.info('Found participant:', participant);

    const peerClient = await takeLatest(
      clients$.pipe(take(1), map(find(propEq('uuid', participant.display))))
    );

    if (!peerClient) return;

    console.info('Found peer client:', peerClient);

    // Cache client id
    clientId = peerClient.uuid;

    console.info(`Initializing ${peerClient.username}'s panner node`);
    const audioContext = await takeLatest(audioContext$);

    // Create media source
    const stream = event.streams[0];
    const audioSource = audioContext.createMediaStreamSource(stream);

    // Create panner node
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
    updateClient(peerClient.uuid, { node, stream });
    console.info(
      `Assigned ${peerClient.username}'s client a PannerNode and a Stream`
    );
  }

  const session = await takeLatest(audioSession$);
  const { peerConnection, onConnect, onDisconnect, onClose } = await listenFeed(
    session,
    room,
    feed,
    onStreamReceive
  );

  onConnect(() => {
    console.info('Connected to feed:', feed);
  });

  onDisconnect(() => {
    console.info('Disconnected from feed:', feed);
    softRemove(clientId);
  });

  onClose(() => {
    console.info('Closed connection to feed:', feed);
    removeClient(clientId);
    removeListening(clientId);
  });

  return peerConnection;
}

export { publishClientMedia, listenToFeed };
