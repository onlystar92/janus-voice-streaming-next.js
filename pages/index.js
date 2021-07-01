import ClientListView from 'components/client/client-list-view';
import Footer from 'components/footer';
import Navigation from 'components/navigation';
import Head from 'next/head';
import {
  audio$,
  setAudioContext,
  setSwitchboardClient,
} from 'observables/audio';
import { user$ } from 'observables/user';
import { prop } from 'ramda';
import { useEffect, useState } from 'react';
import { asyncScheduler } from 'rxjs';
import { map, pluck, take } from 'rxjs/operators';
import { createAudioContext } from 'util/audio';
import createJanusClient from 'util/janus/janus-client';
import takeLatest from 'util/observable/take-latest';
import createSwitchboardClient from 'util/switchboard/switchboard-client';

const userToken$ = user$.pipe(map(prop('token')));
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
    console.info('Initializing voice client');

    // Initialize audio context
    console.info('Creating audio context');
    const audioContext = createAudioContext();
    setAudioContext(audioContext);

    // Connect to switchboard
    asyncScheduler.schedule(() => {
      console.info('Connecting to switchboard client');
      const switchboardClient = createSwitchboardClient();
      setSwitchboardClient(switchboardClient);
    });

    // Connect to janus
    asyncScheduler.schedule(() => {
      userToken$.pipe(take(1)).subscribe(async (token) => {
        if (!token) {
          console.info('No token provided. Skipping connection step.');
          return;
        }

        if (janusClient && janusClient.isConnected()) {
          console.info('Disconnecting previous client');
          await janusClient.disconnect();
        }

        // Connect and assign janus client
        console.info('Creating janus client');
        const client = createJanusClient(token);
        console.info('Connecting to janus');
        client.connect();
        setJanusClient(client);

        // Resume audio context within user intereaction on the page
        window.addEventListener('click', handleClickResume);
      });
    });
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
