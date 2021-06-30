import ClientListView from 'components/client/client-list-view';
import Footer from 'components/footer';
import Navigation from 'components/navigation';
import Head from 'next/head';
import { audio$, setAudioContext } from 'observables/audio';
import { user$ } from 'observables/user';
import { prop } from 'ramda';
import { useEffect, useState } from 'react';
import { map, pluck, take } from 'rxjs/operators';
import { createAudioContext } from 'util/audio';
import createJanusClient from 'util/janus/janus-client';
import takeLatest from 'util/observable/take-latest';

const userToken$ = user$.pipe(take(1), map(prop('token')));
const audioContext$ = audio$.pipe(pluck('audioContext'));

function Home() {
  const [janusClient, setJanusClient] = useState(null);

  // Disconnects the janus client
  function closeSession() {
    if (!janusClient || !janusClient.isConnected()) {
      return;
    }

    janusClient.disconnect();
    setJanusClient(null);
  }

  async function handleClickResume() {
    const audioContext = await takeLatest(audioContext$);
    if (audioContext.state !== 'suspended') return;
    await audioContext.resume();
  }

  useEffect(() => {
    async function initializeClient() {
      const token = await takeLatest(userToken$);

      console.info('Token', token);

      if (!token) return;
      if (janusClient && janusClient.isConnected()) {
        await janusClient.disconnect();
      }

      console.info('Initializing voice client');

      // Initialize audio context
      const audioContext = createAudioContext();
      setAudioContext(audioContext);
      console.info('Assigned audio context');

      // Connect and assign janus client
      const client = createJanusClient(token);
      client.connect();
      setJanusClient(client);
      console.info('Assigned janus client');

      // Resume audio context within user intereaction on the page
      window.addEventListener('click', handleClickResume);
    }

    initializeClient();
    return () => {
      window.removeEventListener('click', handleClickResume);
      closeSession();
    };
  }, []);

  return (
    <div>
      <Head>
        <title>Velt Voice</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="bg-primary-100">
        <Navigation />
        <ClientListView closeSession={closeSession} />
        <Footer />
      </main>
    </div>
  );
}

export default Home;
