import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import SeatMap from '../components/SeatMap';
import { api, type Trip } from '../lib/api';
import { day, etb, time } from '../lib/format';
import { saveDraft } from '../lib/draft';

export default function TripSeats() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const pax = Number(params.get('passengers') ?? 1);
  const nav = useNavigate();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [seats, setSeats] = useState<number[]>([]);
  const [error, setError] = useState('');

  useEffect(() => { api<Trip>(`/trips/${id}`).then(setTrip).catch((e) => setError(e.message)); }, [id]);

  const toggle = (n: number) => setSeats((s) => (s.includes(n) ? s.filter((x) => x !== n) : s.length >= pax ? [...s.slice(1), n] : [...s, n]));
  const done = seats.length === pax;

  if (error) return <div className="narrow"><p className="alert alert-error">{error}</p></div>;
  if (!trip?.layout) return <div className="narrow"><p>Loading seats…</p></div>;

  return (
    <div className="narrow stack">
      <h1 style={{ fontSize: 32 }}>Choose {pax} seat{pax > 1 ? 's' : ''}</h1>
      <p className="muted">{trip.operator.name} · {day(trip.departure_at)} at {time(trip.departure_at)} · {trip.origin.city} → {trip.destination.city}</p>
      <div className="row small" aria-hidden="true">
        <span className="row" style={{ gap: 6 }}><span className="seat" style={{ width: 18, height: 18 }} />Free</span>
        <span className="row" style={{ gap: 6 }}><span className="seat" style={{ width: 18, height: 18, background: 'var(--green)', borderColor: 'var(--green)' }} />Your choice</span>
        <span className="row" style={{ gap: 6 }}><span className="seat" style={{ width: 18, height: 18, background: '#D9DDD8', borderColor: '#D9DDD8' }} />Taken</span>
      </div>
      <SeatMap seatCount={trip.seat_count!} columns={trip.layout.columns} aisleAfter={trip.layout.aisle_after} unavailable={trip.unavailable_seats ?? []} selected={seats} onToggle={toggle} />
      <div className="card row between" style={{ position: 'sticky', bottom: 12 }}>
        <span aria-live="polite">
          {seats.length ? `Seat${seats.length > 1 ? 's' : ''} ${[...seats].sort((a, b) => a - b).join(', ')}` : 'No seat chosen yet'}<br />
          <strong>{etb(trip.price_per_seat * pax)}</strong> <span className="small muted">for {pax} adult{pax > 1 ? 's' : ''}, all-in</span>
        </span>
        <button className="btn btn-primary" disabled={!done} onClick={() => { saveDraft({ tripId: trip.id, seats, passengers: pax }); nav('/checkout'); }}>
          Continue
        </button>
      </div>
    </div>
  );
}
