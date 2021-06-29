import ClientListView from 'components/client/client-list-view';
import Footer from 'components/footer';
import Navigation from 'components/navigation';
import Head from 'next/head';
import { setAudioContext } from 'observables/audio';
import { user$ } from 'observables/user';
import { prop } from 'ramda';
import { useEffect, useState } from 'react';
import { map, take } from 'rxjs/operators';
import { createAudioContext } from 'util/audio';
import createJanusClient from 'util/janus/janus-client';

const userToken$ = user$.pipe(take(1), map(prop('token')));

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

  useEffect(() => {
    userToken$.subscribe((token) => {
      console.info('Token', token);

      if (!token) return;
      if (janusClient && janusClient.isConnected()) janusClient.disconnect();

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
    });
    return closeSession;
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
        <div className="fixed bottom-5 right-5 z-50 mt-2 p-2 px-2 flex flex-col justify-center items-center rounded-lg shadow-sm bg-primary-200 sm:m-0 lg:px-4">
          <div
            className="flex flex-row justify-center items-baseline h-12 w-20"
            id="networkQuality"
          >
            <div className="flex-1 mx-1 h-1/5" />
            <div className="flex-1 mx-1 h-2/5" />
            <div className="flex-1 mx-1 h-3/5" />
            <div className="flex-1 mx-1 h-4/5" />
            <div className="flex-1 mx-1 h-full" />
          </div>
          <div
            className="text-primary-text text-sm mt-2 text-center"
            id="duration"
          />
        </div>
      </main>
    </div>
  );
}

export default Home;
