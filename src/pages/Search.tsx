import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, type Trip } from '../lib/api';
import { day, duration, etb, time } from '../lib/format';

export default function Search() {
  const [params] = useSearchParams();
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [error, setError] = useState('');
  const pax = Number(params.get('passengers') ?? 1);

  useEffect(() => {
    setTrips(null);
    api<{ data: Trip[] }>(`/trips/search?${params.toString()}`)
      .then((r) => setTrips(r.data))
      .catch((e) => setError(e.message));
  }, [params]);

  const first = trips?.[0];
  return (
    <div className="narrow stack">
      <h1 style={{ fontSize: 34 }}>{first ? `${first.origin.city} → ${first.destination.city}` : 'Available buses'}</h1>
      <p className="muted">{params.get('date')} · {pax} passenger{pax > 1 ? 's' : ''} · Prices include the service fee</p>
      <div aria-live="polite">
        {error && <p className="alert alert-error">{error}</p>}
        {!trips && !error && <p>Searching…</p>}
        {trips && trips.length === 0 && <p className="card">No buses with {pax} free seat{pax > 1 ? 's' : ''} on this date. Try another day.</p>}
      </div>
      <ul className="stack" style={{ listStyle: 'none', padding: 0, margin: 0, gap: 12 }}>
        {trips?.map((t) => (
          <li key={t.id} className="card stack" style={{ gap: 12 }}>
            <div className="row between">
              <strong style={{ fontSize: 18 }}>{t.operator.name}</strong>
              <span className="small muted">{t.bus_class === 'vip' ? 'VIP' : 'Standard'}{t.amenities.length ? ` · ${t.amenities.map((a) => a.toUpperCase()).join(', ')}` : ''}</span>
            </div>
            <div className="row between">
              <span><strong style={{ fontSize: 22 }}>{time(t.departure_at)}</strong> <span className="muted">{t.origin.terminal}</span></span>
              <span className="small muted">{duration(t.duration_minutes)}</span>
              <span><strong style={{ fontSize: 22 }}>{time(t.arrival_at)}</strong> <span className="muted">{day(t.arrival_at)}</span></span>
            </div>
            <div className="row between">
              <span className="small">
                {/* Real availability, not artificial scarcity. */}
                {t.seats_left} seats available · Free cancellation until {t.operator.free_cancel_hours} h before departure
              </span>
              <span className="row" style={{ gap: 14 }}>
                <span style={{ textAlign: 'right' }}>
                  <strong className="total" style={{ fontSize: 22 }}>{etb(t.price_per_seat)}</strong><br />
                  <span className="small muted">per adult, all-in ({etb(t.fare)} fare + {etb(t.service_fee_per_seat)} fee)</span>
                </span>
                <Link className="btn btn-primary" to={`/trips/${t.id}?passengers=${pax}`} aria-label={`Choose seats on ${t.operator.name} at ${time(t.departure_at)}`}>Choose seats</Link>
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
