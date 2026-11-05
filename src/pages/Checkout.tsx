import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import Field from '../components/Field';
import { api, ApiError, fieldError, type Booking, type Trip } from '../lib/api';
import { useAuth } from '../lib/auth';
import { readDraft, savePhone } from '../lib/draft';
import { etb } from '../lib/format';

type Pax = { full_name: string; fare_category: 'adult' | 'child' | 'student' };

export default function Checkout() {
  const draft = readDraft();
  const nav = useNavigate();
  const { token, user } = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [pax, setPax] = useState<Pax[]>(() => (draft?.seats ?? []).map(() => ({ full_name: '', fare_category: 'adult' })));
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  // Required consents start unticked. Marketing is separate, optional and unticked.
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isAdult, setIsAdult] = useState(false);
  const [mSms, setMSms] = useState(false);
  const [mEmail, setMEmail] = useState(false);
  const [err, setErr] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (draft) api<Trip>(`/trips/${draft.tripId}`).then(setTrip).catch(() => {}); }, []); // eslint-disable-line

  if (!draft) return <Navigate to="/" replace />;

  const fareFor = (c: Pax['fare_category']) => {
    if (!trip) return 0;
    const pct = c === 'child' ? 50 : c === 'student' ? 20 : 0;
    return Math.round(trip.fare * (100 - pct) / 100);
  };
  const fee = (trip?.service_fee_per_seat ?? 0) * pax.length;
  const total = pax.reduce((s, p) => s + fareFor(p.fare_category), 0) + fee;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      const b = await api<Booking>('/bookings', {
        method: 'POST', token,
        body: {
          trip_id: draft.tripId, contact_phone: phone, contact_email: email || null,
          passengers: pax.map((p, i) => ({ ...p, seat_number: draft.seats[i] })),
          accept_terms: acceptTerms, booker_is_adult: isAdult, marketing_sms: mSms, marketing_email: mEmail && !!email, channel: 'web',
        },
      });
      savePhone(b.reference, phone);
      nav(`/pay/${b.reference}`);
    } catch (x) {
      setErr(x);
      setBusy(false);
      (document.querySelector('[aria-invalid="true"]') as HTMLElement | null)?.focus();
    }
  };

  const seats = [...draft.seats].sort((a, b) => a - b);
  return (
    <form className="narrow stack" onSubmit={submit} noValidate>
      <h1 style={{ fontSize: 32 }}>Who’s travelling?</h1>
      <p className="muted">We only ask for what goes on the ticket and the boarding list.</p>

      {pax.map((p, i) => (
        <fieldset key={i} className="card stack" style={{ border: '1px solid var(--line)' }}>
          <legend style={{ fontWeight: 700, padding: '0 6px' }}>Passenger {i + 1} · Seat {seats[i]}</legend>
          <Field label="Full name" hint="As the bus company will check it at boarding" autoComplete={i === 0 ? 'name' : 'off'} value={p.full_name}
            onChange={(e) => setPax(pax.map((x, j) => (j === i ? { ...x, full_name: e.target.value } : x)))} error={fieldError(err, `passengers.${i}.full_name`)} required />
          <div className="field">
            <label htmlFor={`fare-${i}`}>Fare type</label>
            <select id={`fare-${i}`} value={p.fare_category} onChange={(e) => setPax(pax.map((x, j) => (j === i ? { ...x, fare_category: e.target.value as Pax['fare_category'] } : x)))}>
              <option value="adult">Adult</option>
              <option value="child">Child under 12 (50% off the fare)</option>
              <option value="student">Student with valid ID (20% off the fare)</option>
            </select>
          </div>
        </fieldset>
      ))}

      <fieldset className="card stack" style={{ border: '1px solid var(--line)' }}>
        <legend style={{ fontWeight: 700, padding: '0 6px' }}>Where should we send the ticket?</legend>
        <Field label="Mobile number" type="tel" inputMode="tel" autoComplete="tel" hint="For your ticket SMS and trip updates, e.g. 0911 234 567" value={phone} onChange={(e) => setPhone(e.target.value)} error={fieldError(err, 'contact_phone')} required />
        <Field label="Email (optional)" type="email" autoComplete="email" hint="For an email copy of your ticket" value={email} onChange={(e) => setEmail(e.target.value)} error={fieldError(err, 'contact_email')} />
      </fieldset>

      <section className="card stack" aria-labelledby="price-title">
        <h2 id="price-title" style={{ fontSize: 20 }}>Price</h2>
        {pax.map((p, i) => <div key={i} className="price-row"><span>Seat {seats[i]} · {p.fare_category}</span><span>{etb(fareFor(p.fare_category))}</span></div>)}
        <div className="price-row"><span>Service fee ({etb(trip?.service_fee_per_seat ?? 0)} × {pax.length})</span><span>{etb(fee)}</span></div>
        <div className="price-row" style={{ borderTop: '1px solid var(--line)', paddingTop: 10 }}><strong>Total to pay</strong><strong className="total">{etb(total)}</strong></div>
        <p className="small muted">No other charges. Free cancellation until {trip?.operator.free_cancel_hours ?? 48} h before departure, then a {trip?.operator.late_cancel_fee_percent ?? 20}% fee. <Link to="/refunds" target="_blank">Refund Policy</Link></p>
      </section>

      <fieldset className="card stack" style={{ border: '1px solid var(--line)' }}>
        <legend style={{ fontWeight: 700, padding: '0 6px' }}>Before you book</legend>
        <label className="check">
          <input type="checkbox" checked={isAdult} onChange={(e) => setIsAdult(e.target.checked)} aria-invalid={!!fieldError(err, 'booker_is_adult')} required />
          <span>I am 18 or older. Children can travel as passengers on my booking.</span>
        </label>
        {fieldError(err, 'booker_is_adult') && <span className="error" role="alert">{fieldError(err, 'booker_is_adult')}</span>}
        <label className="check">
          <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} aria-invalid={!!fieldError(err, 'accept_terms')} required />
          <span>I agree to the <Link to="/terms" target="_blank">Terms of Service</Link> and have read the <Link to="/privacy" target="_blank">Privacy Policy</Link>.</span>
        </label>
        {fieldError(err, 'accept_terms') && <span className="error" role="alert">{fieldError(err, 'accept_terms')}</span>}

        <p className="small" style={{ fontWeight: 700, marginTop: 6 }}>Optional</p>
        <label className="check">
          <input type="checkbox" checked={mSms} onChange={(e) => setMSms(e.target.checked)} />
          <span>Send me occasional offers by SMS. You can stop them at any time.</span>
        </label>
        <label className="check">
          <input type="checkbox" checked={mEmail} disabled={!email} onChange={(e) => setMEmail(e.target.checked)} />
          <span>Send me offers by email{!email && ' (add an email above first)'}. Every email has an unsubscribe link.</span>
        </label>
      </fieldset>

      {err instanceof ApiError && err.errors.seats && <p className="alert alert-error" role="alert">{err.errors.seats[0]} <Link to={`/trips/${draft.tripId}?passengers=${draft.passengers}`}>Choose seats again</Link></p>}
      {err instanceof ApiError && !Object.keys(err.errors).length && <p className="alert alert-error" role="alert">{err.message}</p>}
      <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Holding your seats…' : `Continue to payment · ${etb(total)}`}</button>
    </form>
  );
}
