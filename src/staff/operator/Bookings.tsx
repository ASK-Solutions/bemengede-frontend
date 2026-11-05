import { useState, type FormEvent } from 'react';
import Field from '../../components/Field';
import { ApiError, type Booking } from '../../lib/api';
import { etb } from '../../lib/format';
import { Modal, Msg, PageHead, Pill, Table, dateTime, useCall } from '../ui';

type Row = { reference: string; status: string; channel: string; route: string; departure_at: string; passengers: { id: number; full_name: string; seat_number: number }[]; contact_phone: string | null; total: number };
type Detail = Booking & { contact_phone: string | null; channel: string; passenger_ids: number[] };

export default function Bookings() {
  const call = useCall();
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<Row[] | null>(null);
  const [open, setOpen] = useState<Detail | null>(null);
  const [names, setNames] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [msg, setMsg] = useState<[string, 'ok' | 'error']>(['', 'ok']);

  const search = async (e?: FormEvent) => { e?.preventDefault(); setRows(await call<Row[]>(`/operator/bookings?q=${encodeURIComponent(q)}`, 'GET')); };
  const openRef = async (ref: string) => { const d = await call<Detail>(`/operator/bookings/${ref}`, 'GET'); setOpen(d); setNames(d.passengers.map((p) => p.full_name)); setMsg(['', 'ok']); };
  const saveNames = async () => {
    if (!open) return;
    for (let i = 0; i < open.passengers.length; i++) {
      if (names[i] !== open.passengers[i].full_name) await call(`/operator/passengers/${open.passenger_ids[i]}`, 'PATCH', { full_name: names[i] });
    }
    setMsg(['Names updated.', 'ok']); openRef(open.reference);
  };
  const cancel = async () => {
    if (!open) return;
    try {
      const r = await call<{ refund: number }>(`/operator/bookings/${open.reference}/cancel`, 'POST', { reason });
      setMsg([`Cancelled. Refund due: ${etb(r.refund)}.`, 'ok']); openRef(open.reference); search();
    } catch (e) { setMsg([e instanceof ApiError ? (Object.values(e.errors)[0]?.[0] ?? e.message) : 'Failed', 'error']); }
  };

  return (
    <>
      <PageHead title="Bookings" sub="Search by booking reference, phone number or passenger name." />
      <form className="row" onSubmit={search} role="search" style={{ alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: 220 }}><Field label="Search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="BM-XXXXXX, 0911…, or a name" /></div>
        <button className="btn btn-primary">Search</button>
      </form>
      {rows && (
        <Table caption="Bookings found" head={['Reference', 'Trip', 'Passengers', 'Phone', 'Total', 'Channel', 'Status']} empty={!rows.length}>
          {rows.map((r) => (
            <tr key={r.reference}>
              <td><button className="linklike" onClick={() => openRef(r.reference)}>{r.reference}</button></td>
              <td>{r.route}<br /><span className="small muted">{dateTime(r.departure_at)}</span></td>
              <td>{r.passengers.map((p) => `${p.full_name} (${p.seat_number})`).join(', ')}</td>
              <td>{r.contact_phone ?? '—'}</td><td>{etb(r.total)}</td><td>{r.channel}</td><td><Pill status={r.status} /></td>
            </tr>
          ))}
        </Table>
      )}
      <Modal open={!!open} title={open ? `Booking ${open.reference}` : ''} onClose={() => setOpen(null)}>
        {open && <>
          <p><Pill status={open.status} /> · {open.trip.origin.city} → {open.trip.destination.city} · {dateTime(open.trip.departure_at)} · {open.channel}</p>
          <p className="small muted">Contact: {open.contact_phone ?? 'removed at the customer’s request'}</p>
          <Msg text={msg[0]} kind={msg[1]} />
          <fieldset className="stack" style={{ border: 'none', padding: 0 }}>
            <legend style={{ fontWeight: 700 }}>Passengers</legend>
            {open.passengers.map((p, i) => (
              <Field key={p.seat_number} label={`Seat ${p.seat_number} (${p.fare_category})`} value={names[i] ?? ''} onChange={(e) => setNames(names.map((n, j) => (j === i ? e.target.value : n)))} />
            ))}
            <button className="btn btn-ghost" onClick={saveNames}>Save name changes</button>
          </fieldset>
          {(open.status === 'confirmed' || open.status === 'checked_in') && (
            <div className="card stack">
              <strong>Cancel for the customer</strong>
              <p className="small muted">The refund follows your published policy. The customer is shown the same amount online.</p>
              <Field label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} required />
              <button className="btn btn-danger" disabled={!reason} onClick={cancel}>Cancel booking</button>
            </div>
          )}
        </>}
      </Modal>
    </>
  );
}
