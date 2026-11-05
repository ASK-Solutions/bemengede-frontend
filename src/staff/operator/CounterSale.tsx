import { useEffect, useState } from 'react';
import Field from '../../components/Field';
import SeatMap from '../../components/SeatMap';
import { api, ApiError, fieldError, type Booking, type Trip } from '../../lib/api';
import { etb, todayInAddis } from '../../lib/format';
import { Msg, PageHead, Select, dateTime, useCall, useLoad } from '../ui';

type T = { id: number; departure_at: string; route: string; status: string; sold: number; capacity: number };
type P = { full_name: string; fare_category: 'adult' | 'child' | 'student' };

export default function CounterSale() {
  const call = useCall();
  const [trips] = useLoad<T[]>(`/operator/trips?from=${todayInAddis()}&to=${todayInAddis(3)}`);
  const [tripId, setTripId] = useState('');
  const [trip, setTrip] = useState<Trip | null>(null);
  const [seats, setSeats] = useState<number[]>([]);
  const [pax, setPax] = useState<P[]>([]);
  const [phone, setPhone] = useState('');
  const [shown, setShown] = useState(false);
  const [adult, setAdult] = useState(false);
  const [err, setErr] = useState<unknown>(null);
  const [done, setDone] = useState<Booking | null>(null);

  useEffect(() => { setSeats([]); setTrip(null); if (tripId) api<Trip>(`/trips/${tripId}`).then(setTrip); }, [tripId]);
  useEffect(() => { setPax((p) => seats.map((_, i) => p[i] ?? { full_name: '', fare_category: 'adult' })); }, [seats]);

  const fare = (c: P['fare_category']) => (trip ? Math.round(trip.fare * (100 - (c === 'child' ? 50 : c === 'student' ? 20 : 0)) / 100) : 0);
  const total = pax.reduce((a, p) => a + fare(p.fare_category), 0) + (trip?.service_fee_per_seat ?? 0) * pax.length;

  const sell = async () => {
    setErr(null);
    try {
      const b = await call<Booking>('/operator/counter-sales', 'POST', {
        trip_id: +tripId, contact_phone: phone, terms_shown: shown, booker_is_adult: adult,
        passengers: pax.map((p, i) => ({ ...p, seat_number: seats[i] })),
      });
      setDone(b);
    } catch (e) { setErr(e); }
  };
  const reset = () => { setDone(null); setSeats([]); setPhone(''); setShown(false); setAdult(false); api<Trip>(`/trips/${tripId}`).then(setTrip); };

  if (done) {
    return (
      <div className="stack printable">
        <PageHead title={`Sold · ${done.reference}`} actions={<><button className="btn btn-ghost" onClick={() => window.print()}>Print ticket</button><button className="btn btn-primary" onClick={reset}>Next customer</button></>} />
        <div className="card stack">
          <p><strong>{done.trip.operator.name}</strong> · {done.trip.origin.city} → {done.trip.destination.city} · {dateTime(done.trip.departure_at)}</p>
          {done.passengers.map((p) => <p key={p.seat_number}>Seat {p.seat_number}: {p.full_name} ({p.fare_category})</p>)}
          <p>Paid in cash: <strong>{etb(done.price.total)}</strong> (fares {etb(done.price.total - done.price.service_fee)} + service fee {etb(done.price.service_fee)})</p>
          <p className="small muted">The ticket and QR code were sent by SMS to the customer’s phone.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHead title="Counter sale" sub="Sell a ticket for cash at the terminal. Same prices and seat locks as online." />
      <Select label="Trip" value={tripId} onChange={setTripId} options={(trips ?? []).filter((t) => t.status === 'scheduled').map((t) => [t.id, `${dateTime(t.departure_at)} · ${t.route} · ${t.capacity - t.sold} free`])} />
      {trip?.layout && (
        <div className="split">
          <div className="main-col">
            <SeatMap seatCount={trip.seat_count!} columns={trip.layout.columns} aisleAfter={trip.layout.aisle_after} unavailable={trip.unavailable_seats ?? []} selected={seats}
              onToggle={(n) => setSeats((s) => (s.includes(n) ? s.filter((x) => x !== n) : s.length >= 6 ? s : [...s, n]))} />
          </div>
          <div className="side-col card stack">
            {!seats.length && <p className="muted">Pick seats on the map.</p>}
            {pax.map((p, i) => (
              <fieldset key={seats[i]} className="stack" style={{ border: 'none', padding: 0 }}>
                <legend style={{ fontWeight: 700 }}>Seat {seats[i]}</legend>
                <Field label="Passenger name" value={p.full_name} onChange={(e) => setPax(pax.map((x, j) => (j === i ? { ...x, full_name: e.target.value } : x)))} error={fieldError(err, `passengers.${i}.full_name`)} />
                <Select label="Fare type" value={p.fare_category} onChange={(v) => setPax(pax.map((x, j) => (j === i ? { ...x, fare_category: v as P['fare_category'] } : x)))} options={[['adult', 'Adult'], ['child', 'Child under 12 (−50%)'], ['student', 'Student (−20%)']]} />
              </fieldset>
            ))}
            {!!seats.length && <>
              <Field label="Customer mobile (for the ticket SMS)" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} error={fieldError(err, 'contact_phone')} />
              <label className="check"><input type="checkbox" checked={shown} onChange={(e) => setShown(e.target.checked)} /><span>I showed the customer the price, the refund rules and the terms.</span></label>
              {fieldError(err, 'terms_shown') && <span className="error">{fieldError(err, 'terms_shown')}</span>}
              <label className="check"><input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} /><span>The customer paying is 18 or older.</span></label>
              <p className="total">{etb(total)}</p>
              <Msg text={err instanceof ApiError && !Object.keys(err.errors).length ? err.message : err instanceof ApiError && err.errors.seats ? err.errors.seats[0] : ''} kind="error" />
              <button className="btn btn-primary" onClick={sell}>Take {etb(total)} cash and issue ticket</button>
            </>}
          </div>
        </div>
      )}
    </>
  );
}
