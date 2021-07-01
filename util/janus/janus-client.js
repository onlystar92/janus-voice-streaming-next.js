import { Janus as JanusClient } from 'janus-videoroom-client';
import {
  audio$,
  setDataChannel,
  setMediaListener,
  setMediaPublisher,
  setSession,
} from 'observables/audio';
import takeLatest from 'util/observable/take-latest';
import RoomDataChannel from './room/room-data-channel';
import RoomMediaListener from './room/room-media-listener';
import RoomMediaPublisher from './room/room-media-publisher';

const handleConnect = (client) => async () => {
  console.info('Connected to janus');
  console.info('Initializing client session');
  const session = await client.createSession();
  setSession(session);

  console.info('Initializing media listener and publisher');
  const mediaPublisher = new RoomMediaPublisher();
  const mediaListener = new RoomMediaListener();
  setMediaPublisher(mediaPublisher);
  setMediaListener(mediaListener);

  console.info('Initializing data channel');
  const dataChannel = new RoomDataChannel();
  setDataChannel(dataChannel);
};

async function handleDisconnect() {
  console.info('Disconnected from janus');
  const { mediaPublisher, mediaListener, dataChannel } = await takeLatest(
    audio$
  );

  console.info('Closing data channel');
  if (dataChannel) await dataChannel.close();

  console.info('Stopping media publisher and listener');
  if (mediaPublisher) await mediaPublisher.stop();
  if (mediaListener) await mediaListener.close();

  console.info('Removing client session');
  setSession(null);
}

function handleError(error) {
  console.info('An error ocurred:', error);
}

function handleEvent(event) {
  console.info('Event occurred:', event);
}

export default function createJanusClient(token) {
  const client = new JanusClient({
    url: 'wss://vapi.veltpvp.com/janus',
    reconnect: true,
    token,
  });
  client.onConnected(handleConnect(client));
  client.onDisconnected(handleDisconnect);
  client.onError(handleError);
  client.onEvent(handleEvent);

  return client;
}
