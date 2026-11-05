import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Field from '../components/Field';
import { api, type Booking } from '../lib/api';
import { useAuth } from '../lib/auth';
import { savePhone } from '../lib/draft';
import { day, time } from '../lib/format';

export default function MyTrips() {
  const { token } = useAuth();
  const nav = useNavigate();
  const [mine, setMine] = useState<Booking[] | null>(null);
  const [ref, setRef] = useState('');
  const [phone, setPhone] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => { if (token) api<Booking[]>('/me/bookings', { token }).then(setMine).catch(() => {}); }, [token]);

  const find = async (e: FormEvent) => {
    e.preventDefault(); setErr('');
    const r = ref.trim().toUpperCase();
    try {
      await api(`/bookings/${r}?phone=${encodeURIComponent(phone)}`);
      savePhone(r, phone);
      nav(`/booking/${r}`);
    } catch { setErr('We couldn’t find a booking with that reference and phone number.'); }
  };

  return (
    <div className="narrow stack">
      <h1 style={{ fontSize: 34 }}>My trips</h1>
      <form className="card stack" onSubmit={find}>
        <h2 style={{ fontSize: 20 }}>Find a booking</h2>
        <Field label="Booking reference" hint="Starts with BM-, it’s in your ticket SMS" value={ref} onChange={(e) => setRef(e.target.value)} autoCapitalize="characters" required />
        <Field label="Mobile number used to book" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        {err && <p className="error" role="alert">{err}</p>}
        <button className="btn btn-primary">Find booking</button>
      </form>
      {token ? (
        <section className="stack" aria-labelledby="all">
          <h2 id="all" style={{ fontSize: 22 }}>All your bookings</h2>
          {mine?.length === 0 && <p className="muted">No bookings yet.</p>}
          <ul className="stack" style={{ listStyle: 'none', padding: 0, margin: 0, gap: 10 }}>
            {mine?.map((b) => (
              <li key={b.reference} className="card row between">
                <span><strong>{b.trip.origin.city} → {b.trip.destination.city}</strong><br /><span className="small muted">{day(b.trip.departure_at)} {time(b.trip.departure_at)} · {b.trip.operator.name} · {b.status.replace('_', ' ')}</span></span>
                <Link to={`/booking/${b.reference}`} aria-label={`Open booking ${b.reference}`}>{b.reference}</Link>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p><Link to="/sign-in?next=/my-trips">Sign in with your phone</Link> to see every booking made with your number.</p>
      )}
    </div>
  );
}
