import { useState } from 'react';
import { etb } from '../../lib/format';
import { Msg, PageHead, Pill, Table, dateTime, useCall, useLoad } from '../ui';

type V = { id: number; booking: string; bank: string; reference: string; paid: number | null; due: number; receiver: string | null; paid_at: string | null; checks: Record<string, boolean>; decision: string; passenger: string | null };
const LABEL: Record<string, string> = { found: 'Receipt found by verify.et', amount: 'Amount covers the booking', receiver: 'Paid to one of your accounts', after_booking: 'Paid after the booking was made', unused: 'Reference not used before' };

export default function Verifications() {
  const [rows, reload] = useLoad<V[]>('/operator/verifications');
  const call = useCall();
  const [sel, setSel] = useState<V | null>(null);
  const [msg, setMsg] = useState('');
  const pending = rows?.filter((r) => r.decision === 'needs_review') ?? [];

  const decide = async (approve: boolean) => {
    if (!sel) return;
    await call(`/operator/verifications/${sel.id}`, 'POST', { approve });
    setMsg(approve ? `Approved. ${sel.booking} is confirmed and the ticket was sent.` : `Rejected. ${sel.booking} was released.`);
    setSel(null); reload();
  };

  return (
    <>
      <PageHead title="Payment verifications" sub="Bank and wallet transfers are checked with verify.et. If every check passes, the booking is confirmed automatically. The rest wait here." />
      <Msg text={msg} />
      <div className="split">
        <div className="main-col">
          <Table caption="Transfer verifications" head={['Booking', 'Passenger', 'Bank', 'Reference', 'Paid', 'Due', 'Status']} empty={rows?.length === 0}>
            {rows?.map((r) => (
              <tr key={r.id} aria-selected={sel?.id === r.id}>
                <td><button className="linklike" onClick={() => setSel(r)}>{r.booking}</button></td>
                <td>{r.passenger}</td><td>{r.bank}</td><td className="mono">{r.reference}</td>
                <td>{r.paid !== null ? etb(r.paid) : '—'}</td><td>{etb(r.due)}</td><td><Pill status={r.decision} /></td>
              </tr>
            ))}
          </Table>
          <p className="small muted" style={{ marginTop: 8 }}>{pending.length} waiting for review.</p>
        </div>
        <aside className="side-col card stack" aria-live="polite">
          {!sel ? <p className="muted">Choose a booking to see the verify.et result.</p> : <>
            <h2 style={{ fontSize: 20 }}>{sel.booking}</h2>
            <dl className="stack" style={{ gap: 4, margin: 0 }}>
              <div className="row between"><dt className="muted">Paid to</dt><dd style={{ margin: 0 }}>{sel.receiver ?? 'unknown'}</dd></div>
              <div className="row between"><dt className="muted">Paid at</dt><dd style={{ margin: 0 }}>{sel.paid_at ? dateTime(sel.paid_at) : 'unknown'}</dd></div>
            </dl>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }} className="stack">
              {Object.entries(sel.checks ?? {}).map(([k, ok]) => (
                <li key={k} className="check"><span className={`pill-s ${ok ? 'ok' : 'bad'}`}>{ok ? 'Pass' : 'Fail'}</span>{LABEL[k] ?? k}</li>
              ))}
            </ul>
            {sel.decision === 'needs_review' && (
              <div className="row">
                <button className="btn btn-primary" onClick={() => decide(true)}>Approve and issue ticket</button>
                <button className="btn btn-danger" onClick={() => decide(false)}>Reject</button>
              </div>
            )}
          </>}
        </aside>
      </div>
    </>
  );
}
