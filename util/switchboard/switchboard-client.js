import {
  addClient,
  updateClient,
  getActiveClient,
  clients$,
} from 'observables/clients';
import { clone, equals, isNil, not, prop, props } from 'ramda';
import { addPending, audio$, setAudioContext } from 'observables/audio';
import handleRoomChange from 'util/janus/room/room-change-handler';
import { setDeafened, setMuted, settings$ } from 'observables/settings';
import nextApply from 'util/observable/next-apply';
import { combineLatestWith, filter, map, take } from 'rxjs/operators';
import { setUsername, user$ } from 'observables/user';
import {
  calculateDistance,
  calculateForwardDirectionVector,
  calculateHeadDirectionVector,
  parseStringPositions,
} from './positions';

function updateUserPosition(position) {
  audio$.pipe(take(1), map(prop('audioContext'))).subscribe((audioContext) => {
    const newContext = clone(audioContext);
    const headVector = calculateHeadDirectionVector(position);
    const forwardVector = calculateForwardDirectionVector(position);

    // Update listener coordinates
    if (newContext.listener.positionX) {
      newContext.listener.positionX.value = position.x;
      newContext.listener.positionY.value = position.y;
      newContext.listener.positionZ.value = position.z;

      // Update listener head location
      newContext.listener.upX.value = headVector.x;
      newContext.listener.upY.value = headVector.y;
      newContext.listener.upZ.value = headVector.z;

      // Update listener facing direction
      newContext.listener.forwardX.value = forwardVector.x;
      newContext.listener.forwardY.value = forwardVector.y;
      newContext.listener.forwardZ.value = forwardVector.z;
    } else {
      newContext.listener.setPosition(position.x, position.y, position.z);
      newContext.listener.setOrientation(
        forwardVector.x,
        forwardVector.y,
        forwardVector.z,
        headVector.x,
        headVector.y,
        headVector.z
      );
    }

    setAudioContext(newContext);
  });
}

function updatePeerPosition(client, position) {
  // Don't update position if panner node is not initialized
  if (isNil(client.node)) return;

  const { player: uuid, x, y, z } = position;
  const newNode = clone(client.node);
  const forwardVector = calculateForwardDirectionVector(position);

  // Update coordinates
  newNode.positionX.value = x;
  newNode.positionY.value = y;
  newNode.positionZ.value = z;

  // Update forward direction
  newNode.orientationX.value = forwardVector.x;
  newNode.orientationY.value = forwardVector.y;
  newNode.orientationZ.value = forwardVector.z;

  // Update client node
  updateClient(uuid, { node: newNode });
}

function initializeUserClient(uuid, token, room) {
  // Update user information
  nextApply(user$, { uuid, token, room });

  // Create user client
  addClient({ uuid, room });

  // Initialize user media if available
  if (navigator.mediaDevices.getUserMedia) {
    console.info("Initializing client's own stream");
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      updateClient(uuid, { stream });
    });
  }
}

function isWithinDistance(firstPosition, secondPosition) {
  return (
    firstPosition.world === secondPosition.world &&
    firstPosition.server_name === secondPosition.server_name &&
    calculateDistance(firstPosition, secondPosition) <= 80
  );
}

const userUUID$ = user$.pipe(map(prop('uuid')));
const dataChannel$ = audio$.pipe(map(prop('dataChannel')));
const userSettings$ = settings$.pipe(map(props(['muted', 'deafened'])));

function handleMessage(event) {
  let message = event.data;

  try {
    // Parse message
    message = JSON.parse(message);
  } catch (err) {
    console.error('Invalid json message:', message);
    return;
  }

  switch (message.cmd) {
    case 'info': {
      user$
        .pipe(take(1))
        .subscribe(
          ({ uuid: defaultUUID, token: defaultToken, room: defaultRoom }) => {
            const {
              player: uuid = defaultUUID,
              token = defaultToken,
              room = defaultRoom,
            } = message;
            console.info('Initializing user client');
            initializeUserClient(uuid, token, room);
          }
        );
      break;
    }
    case 'updatePositions': {
      const positions = parseStringPositions(message.positions);
      getActiveClient().subscribe((activeClient) => {
        const userPosition = positions.find(
          ({ player: currentUUID }) => currentUUID === activeClient.uuid
        );

        if (isNil(userPosition)) return;

        // Initialize active client username
        if (isNil(activeClient.username)) {
          const playerUsername = userPosition.player_name;
          updateClient(activeClient.uuid, { username: playerUsername });
          setUsername(playerUsername);
        }

        updateUserPosition(userPosition);

        positions
          .filter(({ player }) => not(equals(player, activeClient.uuid)))
          .forEach((position) => {
            if (isNil(position)) return;

            // Check if player is within the distance threshold
            if (!isWithinDistance(position, userPosition)) return;

            const { player: uuid, player_name: username } = position;
            clients$.pipe(take(1)).subscribe((clients) => {
              let currentClient = clients.find(
                (client) => client.uuid === uuid
              );

              // Add new peer client if not found
              if (isNil(currentClient)) {
                currentClient = addClient({ uuid, username });
                console.info('Added new client:', currentClient);

                // Listen to users
                addPending(uuid);
                console.info('Added to pending:', uuid);
              }

              // Update positions
              updatePeerPosition(currentClient, position);
            });
          });
      });
      break;
    }
    case 'joinRoom': {
      const { room } = message;
      console.info('Message to join room:', room);
      handleRoomChange(room);
      break;
    }
    case 'updateConfig': {
      console.info('Received message to update config');
      let { muted, deafened } = message.config;

      // Convert values
      // They all come as strings in the config so need manually converted
      muted = muted === 'true'; // Convert to boolean
      deafened = deafened === 'true'; // Convert to boolean

      dataChannel$
        .pipe(
          filter((channel) => channel.isOpen()),
          take(1),
          combineLatestWith([
            userUUID$.pipe(take(1)),
            userSettings$.pipe(take(1)),
          ])
        )
        .subscribe(([dataChannel, uuid, settings]) => {
          if (!dataChannel.isOpen()) return;
          const [currentMuted, currentDeafened] = settings;

          // Handle muted
          // Validate that there's a change
          if (muted !== currentMuted) {
            // Move the update to the status here
            dataChannel.sendDataMessage({ uuid, muted });
            setMuted(muted);
          }

          // Handle deafened
          if (deafened !== currentDeafened) {
            dataChannel.sendDataMessage({ uuid, deafened });
            setDeafened(deafened);
          }
        });
      break;
    }
    default:
      break;
  }
}

function handleOpen(event) {
  console.info('Switchboard socket open');
  console.info('Event:', event);
}

function handleClose(event) {
  console.info('Connection closed');
  console.info(event);
}

function handleError(error) {
  console.info('Socket error ocurred');
  console.info('Error:', error);
}

export default function createSwitchboardClient() {
  const socket = new WebSocket('wss://vapi.veltpvp.com');
  socket.onopen = handleOpen;
  socket.onmessage = handleMessage;
  socket.onclose = handleClose;
  socket.onerror = handleError;

  function requestConfigUpdate(key, value, operation = 'SET') {
    const message = JSON.stringify({
      topic: 'requestConfigUpdate',
      command: {
        operation,
        key,
        value: value.toString(), // Config stores everything as strings
      },
    });
    socket.send(message);
  }

  return { socket, requestConfigUpdate };
}
