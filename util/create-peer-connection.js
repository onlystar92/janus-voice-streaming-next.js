const DEFAULT_CONFIGURATON = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

function createPeerConnection(configuration = DEFAULT_CONFIGURATON) {
  return new RTCPeerConnection(configuration);
}

export default createPeerConnection;
