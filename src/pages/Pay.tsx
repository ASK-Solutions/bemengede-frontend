import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import Field from '../components/Field';
import { api, ApiError, fieldError, type Booking } from '../lib/api';
import { readPhone } from '../lib/draft';
import { etb } from '../lib/format';

const METHODS = [
  { id: 'telebirr', name: 'telebirr', desc: 'Approve the payment in your telebirr app.' },
  { id: 'chapa', name: 'Chapa', desc: 'Card, CBE Birr, M-Pesa and more on Chapa’s secure page.' },
  { id: 'transfer', name: 'Bank or wallet transfer', desc: 'Pay from your bank app, then enter the transaction reference. We check it with verify.et.' },
] as const;
const BANKS = [['CBE', 'Commercial Bank of Ethiopia'], ['CBE_BIRR', 'CBE Birr'], ['TELEBIRR', 'telebirr'], ['AWASH', 'Awash Bank'], ['DASHEN', 'Dashen Bank'], ['BOA', 'Bank of Abyssinia'], ['SIINQEE', 'Siinqee Bank'], ['MPESA', 'M-Pesa']];

/** Real countdown to the real hold expiry, never a fake timer. */
function useCountdown(iso: string | null) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (!iso) return;
    const tick = () => setLeft(Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [iso]);
  return left;
}

export default function Pay() {
  const { reference = '' } = useParams();
  const phone = readPhone(reference);
  const nav = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [method, setMethod] = useState<(typeof METHODS)[number]['id']>('telebirr');
  const [txRef, setTxRef] = useState<string | null>(null);
  const [bank, setBank] = useState('CBE');
  const [ref, setRef] = useState('');
  const [err, setErr] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const left = useCountdown(booking?.expires_at ?? null);

  useEffect(() => {
    api<Booking>(`/bookings/${reference}?phone=${encodeURIComponent(phone)}`).then(setBooking).catch(setErr);
  }, [reference, phone]);

  if (!phone) return <div className="narrow"><p className="alert">Open this booking from <Link to="/my-trips">My trips</Link> with your phone number.</p></div>;
  if (!booking) return <div className="narrow"><p>{err instanceof Error ? err.message : 'Loading…'}</p></div>;
  if (booking.status !== 'pending_payment') return <Navigate to={`/booking/${reference}`} replace />;

  const start = async () => {
    setBusy(true); setErr(null);
    try {
      const r = await api<{ tx_ref: string; checkout_url: string | null; booking: Booking }>(`/bookings/${reference}/pay`, { method: 'POST', body: { method, phone } });
      setBooking(r.booking);
      if (method === 'transfer') { setTxRef(r.tx_ref); setBusy(false); }
      else if (r.checkout_url) window.location.assign(r.checkout_url);
    } catch (x) { setErr(x); setBusy(false); }
  };

  const submitTransfer = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      await api(`/payments/${txRef}/transfer`, { method: 'POST', body: { phone, bank, reference: ref } });
      nav(`/booking/${reference}`);
    } catch (x) { setErr(x); setBusy(false); }
  };

  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');

  return (
    <div className="narrow stack">
      <h1 style={{ fontSize: 32 }}>Pay {etb(booking.price.total)}</h1>
      <p className="alert" role="timer" aria-live="off">
        Your seats are held for <span aria-hidden="true">{mm}:{ss}</span><span className="sr-only">{Math.ceil(left / 60)} more minutes</span>. After that they are released.
      </p>

      {!txRef ? (
        <>
          <fieldset className="stack" style={{ border: 'none', padding: 0, margin: 0 }}>
            <legend className="small" style={{ fontWeight: 700, marginBottom: 8 }}>Choose how to pay</legend>
            {METHODS.map((m) => (
              <label key={m.id} className="card check" style={{ alignItems: 'center', borderWidth: method === m.id ? 2 : 1, borderColor: method === m.id ? 'var(--green)' : 'var(--line)' }}>
                <input type="radio" name="method" value={m.id} checked={method === m.id} onChange={() => setMethod(m.id)} />
                <span><strong>{m.name}</strong><br /><span className="small muted">{m.desc}</span></span>
              </label>
            ))}
          </fieldset>
          <p className="small muted">You pay exactly {etb(booking.price.total)}. Your booking is confirmed only after the payment provider confirms it to us.</p>
          {err instanceof ApiError && <p className="alert alert-error" role="alert">{err.message}</p>}
          <button className="btn btn-primary btn-block" onClick={start} disabled={busy || left === 0}>
            {method === 'transfer' ? 'Show account details' : `Pay with ${method === 'chapa' ? 'Chapa' : 'telebirr'}`}
          </button>
        </>
      ) : (
        <form className="stack" onSubmit={submitTransfer} noValidate>
          <section className="card stack">
            <h2 style={{ fontSize: 20 }}>1. Send exactly {etb(booking.price.total)} to {booking.trip.operator.name}</h2>
            <ul className="stack" style={{ listStyle: 'none', padding: 0, margin: 0, gap: 8 }}>
              {booking.transfer_accounts.map((a) => (
                <li key={a.bank + a.account_number} className="row between" style={{ background: 'var(--ground)', padding: 12, borderRadius: 10 }}>
                  <span><span className="small muted">{a.bank} · {a.account_name}</span><br /><strong style={{ letterSpacing: '0.04em' }}>{a.account_number}</strong></span>
                  <button type="button" className="btn btn-ghost" onClick={() => navigator.clipboard?.writeText(a.account_number)} aria-label={`Copy ${a.bank} account number`}>Copy</button>
                </li>
              ))}
            </ul>
            <p className="small muted">Add <strong>{booking.reference}</strong> as the remark if your bank allows it.</p>
          </section>
          <section className="card stack">
            <h2 style={{ fontSize: 20 }}>2. Tell us which transfer it was</h2>
            <div className="field">
              <label htmlFor="bank">Bank or wallet you paid from</label>
              <select id="bank" value={bank} onChange={(e) => setBank(e.target.value)}>
                {BANKS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <Field label="Transaction reference" hint="Shown on your bank’s receipt, for example FT25317XXXXX" value={ref} onChange={(e) => setRef(e.target.value)} error={fieldError(err, 'reference')} autoComplete="off" required />
          </section>
          {err instanceof ApiError && !err.errors.reference && <p className="alert alert-error" role="alert">{err.message}</p>}
          <button className="btn btn-primary btn-block" disabled={busy || ref.length < 6}>{busy ? 'Checking with verify.et…' : 'Check my payment'}</button>
        </form>
      )}
    </div>
  );
}
