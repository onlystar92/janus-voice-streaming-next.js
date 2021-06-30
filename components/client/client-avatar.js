import { not } from 'ramda';
import { useEffect, useState } from 'react';

function fetchUserAvatar(username) {
  return fetch(`/api/avatar?user=${username}`);
}

export default function ClientAvatar({ client, onClick, clientType }) {
  const [avatar, setAvatar] = useState('/steve-avatar.png');

  useEffect(() => {
    const { username } = client;

    if (!username) return;

    async function resolveClientAvatar() {
      const response = await fetchUserAvatar(username);

      if (!response || response.status === 500) {
        return;
      }

      const parsedResponse = await response.json();
      setAvatar(parsedResponse.avatar);
    }

    resolveClientAvatar();
  }, [client.username]);

  useEffect(() => {
    const { stream } = client;

    if (!stream) return;

    stream.getTracks()[0].onmute = () => {
      console.log('stream muted', 'muted');
    };

    stream.getTracks()[0].onunmute = () => {
      console.log('stream unmuted', 'unmuted');
    };
  }, [client.stream]);

  const isSelf = clientType === 'self';

  return (
    /* eslint-disable jsx-a11y/click-events-have-key-events */
    /* eslint-disable jsx-a11y/interactive-supports-focus */
    <div
      className="flex-shrink-0 w-8 h-16 lg:w-14 relative flex items-center justify-center"
      onClick={onClick}
      role="button"
    >
      <img
        className="w-full h-full"
        src={avatar}
        alt={`${client.username}'s avatar`}
        width="auto"
        height="auto"
      />
      {!isSelf && !client.muted && (
        <img className="absolute w-9/12" src="/mute.png" alt="Mute icon" />
      )}
      {!isSelf && client.muted && (
        <img className="absolute w-9/12" src="/muted.png" alt="Unmute icon" />
      )}
    </div>
  );
}
