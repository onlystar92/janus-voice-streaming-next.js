import { audio$ } from 'observables/audio';
import { getMediaStream } from 'util/audio';
import takeLatest from 'util/observable/take-latest';
import createPeerConnection from 'util/create-peer-connection';

const DEFAULT_CONSTRAINTS = { audio: true, video: false };

async function listParticipants(room) {
  const { session } = await takeLatest(audio$);
  const handle = await session.videoRoom().defaultHandle();
  return handle.listParticipants({ room });
}

function handleIceCandidate(handle, peerConnection) {
  return async (event) => {
    if (!event.candidate) {
      console.info('No event candidate');
      return;
    }

    const { candidate } = event;
    console.info('Got ice candidate:', candidate);
    peerConnection.addIceCandidate(candidate);

    console.info('Trkcling ice candidate');
    handle.trickle(candidate);
  };
}

function average(values) {
  const sumValues = values.reduce((sum, value) => sum + value, 0);
  return sumValues / values.length;
}

function msToTime(duration) {
  let seconds = Math.floor((duration / 1000) % 60);
  let minutes = Math.floor((duration / (1000 * 60)) % 60);
  let hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

  hours = hours < 10 ? `0${hours}` : hours;
  minutes = minutes < 10 ? `0${minutes}` : minutes;
  seconds = seconds < 10 ? `0${seconds}` : seconds;

  return `${hours}:${minutes}:${seconds}`;
}

function showPeerConnectionStatus(connection) {
  const start = Date.now();

  window.setInterval(() => {
    const rttMeasures = [];
    const sender = connection.getSenders()[0];

    // Show Duration
    const delta = Date.now() - start; // milliseconds elapsed since start
    document.getElementById('duration').innerText = msToTime(delta);

    sender.getStats(null).then((stats) => {
      stats.forEach((report) => {
        if (report.type === 'remote-inbound-rtp') {
          rttMeasures.push(report.roundTripTime);
          const avgRtt = average(rttMeasures);

          let emodel = 0;
          if (avgRtt / 2 >= 0.5) emodel = 1;
          else if (avgRtt / 2 >= 0.4) emodel = 2;
          else if (avgRtt / 2 >= 0.3) emodel = 3;
          else if (avgRtt / 2 >= 0.2) emodel = 4;
          else if (avgRtt / 2 < 0.2) emodel = 5;

          // Draw Network Quality Bar
          const elements = document.querySelectorAll('#networkQuality > div');
          elements.forEach((el, key) => {
            if (emodel - 1 >= key) {
              // These claseses need to be added to the class purge safe list
              // in tailwind.config.js
              el.classList.remove('bg-gray-600');
              el.classList.add('bg-gray-300');
            } else {
              el.classList.remove('bg-gray-300');
              el.classList.add('bg-gray-600');
            }
          });
        }
      });
    });
  }, 1000);
}

async function publishClientMediaStream({
  session,
  uuid,
  room,
  token,
  localDescription,
}) {
  const roomHandle = await session.videoRoom().defaultHandle();
  const { id, jsep } = await roomHandle.publishFeed({
    room,
    token,
    display: uuid,
    jsep: localDescription,
    audio: true,
    video: false,
  });
  return { roomHandle, id, jsep };
}

async function publishAudioTracks(
  userData,
  session,
  room,
  constraints = DEFAULT_CONSTRAINTS
) {
  const { uuid, token } = userData;

  // Get user media stream
  const stream = await getMediaStream(constraints);
  const audioTrack = stream.getAudioTracks()[0];

  // Create peer connection with audio tracks
  const peerConnection = createPeerConnection();
  const trackSender = peerConnection.addTrack(audioTrack, stream);

  // Show conection stability status
  showPeerConnectionStatus(peerConnection);

  // Create peer connection offer
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  // Publish active client stream
  const { roomHandle, id, jsep } = await publishClientMediaStream({
    uuid,
    room,
    token,
    session,
    localDescription: peerConnection.localDescription,
  });

  // Set received answer
  const answer = new RTCSessionDescription(jsep);
  await peerConnection.setRemoteDescription(answer);

  // Handle ice candidates
  peerConnection.onicecandidate = handleIceCandidate(
    roomHandle,
    peerConnection
  );

  return { id, peerConnection, trackSender };
}

async function listenFeed(session, room, feed, onStreamReceive) {
  let onConnect;
  let onDisconnect;
  let onClose;

  // Create peer connection
  const peerConnection = createPeerConnection();

  // Handle connection state
  peerConnection.onconnectionstatechange = async (event) => {
    switch (peerConnection.connectionState) {
      case 'connected':
        await onConnect(event);
        break;
      case 'disconnected':
      case 'failed':
        await onDisconnect(event);
        break;
      case 'closed':
        await onClose(event);
        break;
      default:
        break;
    }
  };

  // Handle track event
  peerConnection.ontrack = onStreamReceive;

  // Listen to feed
  const listenHandle = await session.videoRoom().listenFeed(room, feed);
  peerConnection.onicecandidate = handleIceCandidate(
    listenHandle,
    peerConnection
  );

  // Create offer
  const offer = new RTCSessionDescription({
    type: 'offer',
    sdp: listenHandle.getOffer(),
  });
  peerConnection.setRemoteDescription(offer);

  // Create answer
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  await listenHandle.setRemoteAnswer(answer.sdp);

  return {
    peerConnection,
    onConnect(callback) {
      onConnect = callback;
    },
    onDisconnect(callback) {
      onDisconnect = callback;
    },
    onClose(callback) {
      onClose = callback;
    },
  };
}

export { publishAudioTracks, listenFeed, listParticipants };
