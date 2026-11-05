import { useState } from 'react';
import Field from '../../components/Field';
import { etb } from '../../lib/format';
import { Msg, PageHead, Pill, Table, dateTime, useCall, useLoad } from '../ui';

type P = {
  mode: string; commission_percent: number; service_fee_per_seat: number;
  providers: { key: string; name: string; configured: boolean; webhook: string; last_success: string | null; today: Record<string, number>; fee_percent?: number; auto_approved_today?: number; needs_review?: number }[];
  refunds_due: { id: number; provider: string; amount: number; provider_reference: string | null; updated_at: string; booking: { reference: string } }[];
};

export default function Payments() {
  const [p, reload] = useLoad<P>('/admin/providers');
  const call = useCall();
  const [refs, setRefs] = useState<Record<number, string>>({});
  const [msg, setMsg] = useState('');
  if (!p) return <p>Loading…</p>;

  const refunded = async (id: number) => { await call(`/admin/payments/${id}/refunded`, 'POST', { reference: refs[id] }); setMsg('Marked as refunded.'); reload(); };

  return (
    <>
      <PageHead title="Payment providers" sub="Credentials are kept in the server environment and are never shown or edited in the browser. Bookings are confirmed only after a server-to-server check." />
      <p className={`alert ${p.mode === 'live' ? 'alert-ok' : ''}`}>Mode: <strong>{p.mode === 'live' ? 'Live' : 'Test (mock): no real money moves'}</strong> · Commission {p.commission_percent}% · Service fee {etb(p.service_fee_per_seat)} per seat</p>
      <Msg text={msg} />
      <div className="grid-kpi" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        {p.providers.map((x) => (
          <section key={x.key} className="card stack" aria-labelledby={`p-${x.key}`}>
            <div className="row between"><h2 id={`p-${x.key}`} style={{ fontSize: 22 }}>{x.name}</h2><Pill status={x.configured ? 'active' : 'pending'} label={x.configured ? 'Credentials set' : 'Not configured'} /></div>
            <dl className="stack" style={{ margin: 0, gap: 6, fontSize: 14 }}>
              <div className="row between"><dt className="muted">Webhook URL</dt><dd className="mono" style={{ margin: 0, wordBreak: 'break-all' }}>{x.webhook}</dd></div>
              <div className="row between"><dt className="muted">Last confirmed payment</dt><dd style={{ margin: 0 }}>{x.last_success ? dateTime(x.last_success) : 'none yet'}</dd></div>
              <div className="row between"><dt className="muted">Today</dt><dd style={{ margin: 0 }}>{Object.entries(x.today).map(([k, n]) => `${n} ${k}`).join(', ') || 'none'}</dd></div>
              {x.fee_percent !== undefined && <div className="row between"><dt className="muted">Gateway fee (from contract)</dt><dd style={{ margin: 0 }}>{x.fee_percent}%</dd></div>}
              {x.needs_review !== undefined && <div className="row between"><dt className="muted">Auto-approved today / waiting review</dt><dd style={{ margin: 0 }}>{x.auto_approved_today} / {x.needs_review}</dd></div>}
            </dl>
          </section>
        ))}
      </div>
      <h2 style={{ fontSize: 20 }}>Refunds to send</h2>
      <p className="small muted">Customers who paid after their seats were released, plus anything else waiting for a refund. Send the money back, then record the provider's refund reference here.</p>
      <Table caption="Refunds due" head={['Booking', 'Method', 'Amount', 'Since', 'Refund reference', '']} empty={!p.refunds_due.length}>
        {p.refunds_due.map((r) => (
          <tr key={r.id}><td>{r.booking.reference}</td><td>{r.provider}</td><td>{etb(r.amount)}</td><td>{dateTime(r.updated_at)}</td>
            <td><Field label={`Refund reference for ${r.booking.reference}`} value={refs[r.id] ?? ''} onChange={(e) => setRefs({ ...refs, [r.id]: e.target.value })} /></td>
            <td><button className="btn btn-ghost" disabled={!refs[r.id]} onClick={() => refunded(r.id)}>Mark refunded</button></td></tr>
        ))}
      </Table>
    </>
  );
}
