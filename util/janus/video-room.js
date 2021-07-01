import { audio$ } from 'observables/audio';
import { getMediaStream } from 'util/audio';
import takeLatest from 'util/observable/take-latest';
import createPeerConnection from 'util/create-peer-connection';

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

async function publishAudioTracks({ uuid, token }, session, room) {
  // Get user audio stream
  const stream = await getMediaStream({ audio: true, video: false });
  const audioTrack = stream.getAudioTracks()[0];

  // Initialize peer connection
  const peerConnection = createPeerConnection();
  const publisherHandle = await session.videoRoom().defaultHandle();
  const trackSender = peerConnection.addTrack(audioTrack, stream);

  // Create peer connection offer
  const offer = await peerConnection.createOffer();
  peerConnection.setLocalDescription(offer);

  // Publish client stream
  const { id: publisherId, jsep } = await publisherHandle.publishFeed({
    room,
    token,
    display: uuid,
    jsep: offer,
    audio: true,
    video: false,
  });
  peerConnection.setRemoteDescription(new RTCSessionDescription(jsep));

  // Configure track sender
  const parameters = trackSender.getParameters();
  const bitrate = 256;
  parameters.encodings[0].maxBitrate = bitrate * 1000;
  trackSender.setParameters(parameters);

  // Handle ice candidates
  peerConnection.onicecandidate = handleIceCandidate(
    publisherHandle,
    peerConnection
  );

  return { publisherId, peerConnection, trackSender };
}

async function listenFeed(session, room, feed) {
  // Create peer connection
  const peerConnection = createPeerConnection();

  // Listen to remote feed
  const listenHandle = await session.videoRoom().listenFeed(room, feed);
  const offer = listenHandle.getOffer();
  peerConnection.setRemoteDescription(
    new RTCSessionDescription({
      type: 'offer',
      sdp: offer,
    })
  );

  // Create and assign answer
  const answer = await peerConnection.createAnswer();
  peerConnection.setLocalDescription(answer);
  listenHandle.setRemoteAnswer(answer.sdp);

  // Handle ice candidates
  peerConnection.onicecandidate = handleIceCandidate(
    listenHandle,
    peerConnection
  );

  return { peerConnection, listenHandle };
}

export { publishAudioTracks, listenFeed, listParticipants };
