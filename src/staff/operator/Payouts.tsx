import { useState } from 'react';
import Field from '../../components/Field';
import { etb, todayInAddis } from '../../lib/format';
import { Kpis, PageHead, Pill, Table, useLoad } from '../ui';

type Row = { channel: string; count: number; gross: number; service_fees: number; fares: number; commission: number; gateway_fee: number; net_to_operator: number };
type P = { commission_percent: number; summary: Row[]; settlements: { id: number; period_start: string; period_end: string; channel: string; gross: number; commission: number; net_to_operator: number; status: string; payout_reference: string | null }[]; payout_accounts: { bank: string; account_number: string }[] };
const CH: Record<string, string> = { chapa: 'Chapa', telebirr: 'telebirr', transfer: 'Bank transfer', cash: 'Cash at counter' };

export default function Payouts() {
  const [from, setFrom] = useState(todayInAddis().slice(0, 8) + '01');
  const [to, setTo] = useState(todayInAddis());
  const [d] = useLoad<P>(`/operator/payouts?from=${from}&to=${to}`);
  const sum = (k: keyof Row) => (d?.summary ?? []).reduce((a, r) => a + (r[k] as number), 0);

  return (
    <>
      <PageHead title="Payouts & finance" sub={d ? `Bemengede commission: ${d.commission_percent}% of fares sold online. Counter sales are commission-free unless agreed otherwise.` : ''} />
      <div className="row"><Field label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /><Field label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
      <Kpis items={[['Fares sold', etb(sum('fares'))], ['Commission', etb(sum('commission'))], ['Owed to you', etb(sum('net_to_operator'))], ['Payments', sum('count')]]} />
      <Table caption="By payment method" head={['Method', 'Payments', 'Collected', 'Service fees (Bemengede)', 'Fares', 'Commission', 'Owed to you']} empty={d?.summary.length === 0}>
        {d?.summary.map((r) => <tr key={r.channel}><td>{CH[r.channel] ?? r.channel}</td><td>{r.count}</td><td>{etb(r.gross)}</td><td>{etb(r.service_fees)}</td><td>{etb(r.fares)}</td><td>{etb(r.commission)}</td><td><strong>{etb(r.net_to_operator)}</strong></td></tr>)}
      </Table>
      <h2 style={{ fontSize: 20 }}>Settlements</h2>
      <p className="small muted">Chapa pays your share directly when your subaccount is linked. Bank transfers and cash already reached you, so the commission is invoiced. telebirr is paid out by Bemengede to {d?.payout_accounts[0] ? `${d.payout_accounts[0].bank} ${d.payout_accounts[0].account_number}` : 'your account'}.</p>
      <Table caption="Settlements" head={['Period', 'Method', 'Collected', 'Commission', 'Net to you', 'Status', 'Reference']} empty={d?.settlements.length === 0}>
        {d?.settlements.map((s) => <tr key={s.id}><td>{s.period_start.slice(0, 10)} – {s.period_end.slice(0, 10)}</td><td>{CH[s.channel] ?? s.channel}</td><td>{etb(s.gross)}</td><td>{etb(s.commission)}</td><td>{etb(s.net_to_operator)}</td><td><Pill status={s.status} /></td><td>{s.payout_reference ?? '—'}</td></tr>)}
      </Table>
    </>
  );
}
