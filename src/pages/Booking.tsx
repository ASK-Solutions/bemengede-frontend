import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { api, ApiError, type Booking } from '../lib/api';
import { useAuth } from '../lib/auth';
import { readPhone, savePhone } from '../lib/draft';
import { day, etb, time } from '../lib/format';

const STATUS: Record<Booking['status'], string> = {
  pending_payment: 'Waiting for payment',
  awaiting_verification: 'Payment being checked by the bus company',
  confirmed: 'Confirmed',
  checked_in: 'Checked in',
  cancelled: 'Cancelled',
  expired: 'Expired: payment was not completed in time',
  refunded: 'Refunded',
};

export default function BookingPage() {
  const { reference = '' } = useParams();
  const [q] = useSearchParams();
  const phone = q.get('phone') ?? readPhone(reference);
  const { token } = useAuth();
  const [b, setB] = useState<Booking | null>(null);
  const [err, setErr] = useState('');
  const [quote, setQuote] = useState<{ allowed: boolean; refund: number; fee: number; reason?: string } | null>(null);
  const [msg, setMsg] = useState('');

  const load = () => api<Booking>(`/bookings/${reference}?phone=${encodeURIComponent(phone)}`, { token }).then((x) => { setB(x); if (phone) savePhone(reference, phone); }).catch((e) => setErr(e.message));

  useEffect(() => { load(); }, [reference]); // eslint-disable-line

  // Returning from telebirr/Chapa: ask our server to confirm with the provider.
  useEffect(() => {
    if (b?.status === 'pending_payment' && b.payment?.tx_ref && b.payment.provider !== 'transfer') {
      api(`/payments/${b.payment.tx_ref}?phone=${encodeURIComponent(phone)}`).then(load).catch(() => {});
    }
  }, [b?.payment?.tx_ref]); // eslint-disable-line

  if (err) return <div className="narrow stack"><p className="alert alert-error">{err}</p><Link to="/my-trips">Find a booking</Link></div>;
  if (!b) return <div className="narrow"><p>Loading…</p></div>;

  const paid = b.status === 'confirmed' || b.status === 'checked_in';
  const askCancel = () => api<typeof quote>(`/bookings/${reference}/cancellation?phone=${encodeURIComponent(phone)}`, { token }).then(setQuote);
  const cancel = async () => {
    try {
      await api(`/bookings/${reference}/cancel`, { method: 'POST', token });
      setMsg('Your booking is cancelled. The refund goes back to the way you paid.');
      setQuote(null); load();
    } catch (e) { setMsg(e instanceof ApiError ? e.message : 'Could not cancel.'); }
  };

  return (
    <div className="narrow stack">
      <p className={`alert ${paid ? 'alert-ok' : ''}`} role="status">{STATUS[b.status]}</p>
      <h1 style={{ fontSize: 32 }}>{b.trip.origin.city} → {b.trip.destination.city}</h1>
      <p className="muted">{b.trip.operator.name} · {day(b.trip.departure_at)} · departs {time(b.trip.departure_at)} from {b.trip.origin.terminal}</p>

      {b.status === 'pending_payment' && <Link className="btn btn-primary" to={`/pay/${b.reference}`}>Continue to payment</Link>}

      <ul className="stack" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {b.passengers.map((p) => (
          <li key={p.seat_number} className="card row between">
            <span><strong>{p.full_name}</strong><br /><span className="muted">Seat {p.seat_number} · {p.fare_category}</span></span>
            {p.qr && <QRCodeSVG value={p.qr} size={132} title={`Boarding QR code for ${p.full_name}, seat ${p.seat_number}`} />}
          </li>
        ))}
      </ul>

      <section className="card stack" aria-labelledby="receipt">
        <h2 id="receipt" style={{ fontSize: 20 }}>Receipt · {b.reference}</h2>
        <div className="price-row"><span>Fares</span><span>{etb(b.price.subtotal - b.price.discount)}</span></div>
        <div className="price-row"><span>Service fee</span><span>{etb(b.price.service_fee)}</span></div>
        <div className="price-row"><strong>Total</strong><strong>{etb(b.price.total)}</strong></div>
        {b.refund_amount !== null && <div className="price-row"><span>Refund</span><span>{etb(b.refund_amount)}</span></div>}
      </section>

      {paid && (
        <section className="card stack" aria-labelledby="cancel-title">
          <h2 id="cancel-title" style={{ fontSize: 20 }}>Cancel this trip</h2>
          {!quote && <button className="btn btn-ghost" onClick={askCancel}>See what I’d get back</button>}
          {quote && !quote.allowed && <p>{quote.reason}</p>}
          {quote?.allowed && (
            <>
              <p>If you cancel now you get <strong>{etb(quote.refund)}</strong> back{quote.fee ? ` (${etb(quote.fee)} late-cancellation fee)` : ''}. The service fee is not refunded. <Link to="/refunds">Refund Policy</Link></p>
              {token ? <button className="btn btn-danger" onClick={cancel}>Cancel booking</button>
                : <p><Link to={`/sign-in?next=/booking/${b.reference}`}>Sign in with your phone</Link> to cancel. We’ll send a code to confirm it’s you.</p>}
            </>
          )}
        </section>
      )}
      {msg && <p className="alert" role="status">{msg}</p>}
    </div>
  );
}
