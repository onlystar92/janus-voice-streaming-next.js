import { isNil, not } from 'ramda';

export default function RoomDataChannel() {
  let dataChannel;

  function open(connection) {
    dataChannel = connection.createDataChannel('sendDataChannel', {
      maxRetransmits: 0,
      reliable: false,
    });
  }

  function close() {
    dataChannel.close();
  }

  function sendDataMessage(message) {
    const { readyState } = dataChannel;
    if (readyState !== 'open') return;
    dataChannel.send(message);
  }

  function isOpen() {
    return not(isNil(dataChannel));
  }

  return { open, close, isOpen, sendDataMessage };
}
