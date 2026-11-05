import { useState } from 'react';
import Field from '../../components/Field';
import { ApiError } from '../../lib/api';
import { etb, todayInAddis } from '../../lib/format';
import { Msg, PageHead, Pill, Table, useCall, useLoad } from '../ui';

type S = { id: number; operator: { name: string }; period_start: string; period_end: string; channel: string; gross: number; gateway_fee: number; commission: number; service_fees: number; net_to_operator: number; status: string; payout_reference: string | null };

export default function Settlements() {
  const [rows, reload] = useLoad<S[]>('/admin/settlements');
  const call = useCall();
  const [from, setFrom] = useState(todayInAddis(-7));
  const [to, setTo] = useState(todayInAddis(-1));
  const [refs, setRefs] = useState<Record<number, string>>({});
  const [msg, setMsg] = useState<[string, 'ok' | 'error']>(['', 'ok']);

  const generate = async () => {
    try { const r = await call<{ created: number }>('/admin/settlements', 'POST', { from, to }); setMsg([`${r.created} settlement(s) created.`, 'ok']); reload(); }
    catch (e) { setMsg([e instanceof ApiError ? (Object.values(e.errors)[0]?.[0] ?? e.message) : 'Failed', 'error']); }
  };
  const paid = async (id: number) => { await call(`/admin/settlements/${id}/paid`, 'POST', { payout_reference: refs[id] }); reload(); };

  return (
    <>
      <PageHead title="Settlements" sub="Each successful payment is counted once. Chapa splits settle automatically; transfers and cash went straight to the operator, so commission is invoiced; telebirr is paid out by Bemengede." />
      <div className="card row" style={{ alignItems: 'flex-end' }}>
        <Field label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Field label="To (up to yesterday)" type="date" value={to} max={todayInAddis(-1)} onChange={(e) => setTo(e.target.value)} />
        <button className="btn btn-primary" onClick={generate}>Create settlements</button>
      </div>
      <Msg text={msg[0]} kind={msg[1]} />
      <Table caption="Settlements" head={['Operator', 'Period', 'Method', 'Collected', 'Gateway fee', 'Service fees', 'Commission', 'Net to operator', 'Status', 'Payout']} empty={rows?.length === 0}>
        {rows?.map((s) => (
          <tr key={s.id}>
            <td>{s.operator.name}</td><td>{s.period_start.slice(0, 10)} – {s.period_end.slice(0, 10)}</td><td>{s.channel}</td>
            <td>{etb(s.gross)}</td><td>{etb(s.gateway_fee)}</td><td>{etb(s.service_fees)}</td><td>{etb(s.commission)}</td><td><strong>{etb(s.net_to_operator)}</strong></td>
            <td><Pill status={s.status} /></td>
            <td>{s.status === 'scheduled'
              ? <span className="row" style={{ gap: 6 }}><Field label={`Bank reference for settlement ${s.id}`} value={refs[s.id] ?? ''} onChange={(e) => setRefs({ ...refs, [s.id]: e.target.value })} /><button className="btn btn-ghost" disabled={!refs[s.id]} onClick={() => paid(s.id)}>Mark paid</button></span>
              : s.payout_reference ?? '—'}</td>
          </tr>
        ))}
      </Table>
    </>
  );
}
