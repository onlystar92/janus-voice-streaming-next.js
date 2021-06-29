import clsx from 'clsx';
import { clients$ } from 'observables/clients';
import { useObservable } from 'rxjs-hooks';
import ClientDisplay from './client-display';

function ClientListView({ closeSession }) {
  const clients = useObservable(() => clients$, []);
  return (
    <div
      className={clsx(
        'px-6 py-4 min-h-screen  flex flex-col items-stretch',
        'sm:grid sm:grid-cols-2 sm:items-start sm:gap-y-2 sm:gap-x-2',
        'md:grid-cols-2 md:gap-y-2 md:gap-x-2 md:py-6',
        'lg:px-12 lg:grid-cols-3 lg:gap-y-3 lg:gap-x-10 lg:py-10'
      )}
    >
      {clients
        .filter((client) => !client.removed)
        .map((client) => (
          <ClientDisplay
            key={client.uuid}
            client={client}
            closeSession={closeSession}
          />
        ))}
    </div>
  );
}

export default ClientListView;
