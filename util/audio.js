function enumerateMediaDevices() {
  return navigator.mediaDevices.enumerateDevices();
}

async function findDeviceByLabel(name) {
  const devices = await enumerateMediaDevices();
  return devices.find((device) => device.label === name);
}

function getMediaStream(constraints) {
  return navigator.mediaDevices.getUserMedia(constraints);
}

function getDeviceMediaStream(device) {
  return getMediaStream({ audio: { deviceId: device.deviceId, noiseSupression: true} });
}

function createAudioContext() {
  const AudioContext = window?.AudioContext ?? window?.webkitAudioContext;
  return new AudioContext();
}

function createDefaultListener() {
  const audioContext = createAudioContext();

  // Set default listener position
  if (audioContext.listener.positionX) {
    audioContext.listener.positionX.value = 0;
    audioContext.listener.positionY.value = 0;
    audioContext.listener.positionZ.value = 0;
    audioContext.listener.forwardX.value = 0;
    audioContext.listener.forwardY.value = 0;
    audioContext.listener.forwardZ.value = 0;
    audioContext.listener.upX.value = 0;
    audioContext.listener.upY.value = 0;
    audioContext.listener.upZ.value = 0;
  } else {
    audioContext.listener.setPosition(0, 0, 0);
    audioContext.listener.setOrientation(0, 0, 0, 0, 0, 0);
  }

  return audioContext;
}

export {
  enumerateMediaDevices,
  findDeviceByLabel,
  getMediaStream,
  getDeviceMediaStream,
  createAudioContext,
  createDefaultListener,
};
