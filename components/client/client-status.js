import { audio$ } from 'observables/audio';
import { range } from 'ramda';
import { useEffect, useRef, useState } from 'react';
import { interval } from 'rxjs';
import { pluck } from 'rxjs/operators';
import takeLatest from 'util/observable/take-latest';

const mediaPublisher$ = audio$.pipe(pluck('mediaPublisher'));

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

function ClientStatus() {
  const [duration, setDuration] = useState(msToTime(0));
  const [quality, setQuality] = useState([]);
  const start = useRef(Date.now());

  useEffect(() => {
    const updateSubscription = interval(1000).subscribe(async () => {
      // Show Duration
      const delta = Date.now() - start.current; // milliseconds elapsed since start
      setDuration(msToTime(delta));

      const mediaPublisher = await takeLatest(mediaPublisher$);
      if (!mediaPublisher) return;

      const connection = mediaPublisher.getConnection();
      if (!connection) return;

      const rttMeasures = [];
      const sender = connection.getSenders()[0];
      const stats = await sender.getStats(null);

      stats.forEach((report) => {
        if (report.type !== 'remote-inbound-rtp') return;
        rttMeasures.push(report.roundTripTime);
        const avgRtt = average(rttMeasures);

        let emodel = 0;
        if (avgRtt / 2 >= 0.5) emodel = 1;
        else if (avgRtt / 2 >= 0.4) emodel = 2;
        else if (avgRtt / 2 >= 0.3) emodel = 3;
        else if (avgRtt / 2 >= 0.2) emodel = 4;
        else if (avgRtt / 2 < 0.2) emodel = 5;

        // Update network quality bar
        setQuality(emodel);
      });
    });

    return () => updateSubscription.unsubscribe();
  }, []);

  return (
    <div className="flex">
      <div className="flex flex-row justify-center items-baseline h-3 w-5">
        {range(1, 6).map((i) => {
          const height = i < 5 ? `h-${i}/5` : 'h-full';
          const color = quality >= i ? 'bg-gray-300' : 'bg-gray-600';
          return <div key={i} className={`flex-1 m-px ${color} ${height}`} />;
        })}
      </div>
      <div className="ml-2 text-primary-text text-xs text-center">
        {duration}
      </div>
    </div>
  );
}

export default ClientStatus;
