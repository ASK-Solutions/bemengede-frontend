import { useState } from 'react';
import Field from '../../components/Field';
import { etb } from '../../lib/format';
import { Modal, PageHead, Pill, Table, dateTime, useCall, useLoad } from '../ui';

type D = { id: number; subject: string; description: string; status: string; resolution: string | null; created_at: string; booking: { reference: string; total: number; status: string } | null; operator: { name: string } | null };

export default function Disputes() {
  const [status, setStatus] = useState('open');
  const [rows, reload] = useLoad<D[]>(`/admin/disputes?status=${status}`);
  const call = useCall();
  const [sel, setSel] = useState<D | null>(null);
  const [text, setText] = useState('');

  const decide = async (s: 'resolved' | 'rejected') => { await call(`/admin/disputes/${sel!.id}`, 'POST', { status: s, resolution: text }); setSel(null); setText(''); reload(); };

  return (
    <>
      <PageHead title="Disputes" sub="Complaints raised by travellers about a booking." />
      <div className="tabs" role="group" aria-label="Filter">
        {['open', 'resolved', 'rejected'].map((s) => <button key={s} className="chip" aria-pressed={status === s} onClick={() => setStatus(s)}>{s}</button>)}
      </div>
      <Table caption="Disputes" head={['Opened', 'Subject', 'Booking', 'Operator', 'Status']} empty={rows?.length === 0}>
        {rows?.map((d) => (
          <tr key={d.id}><td>{dateTime(d.created_at)}</td><td><button className="linklike" onClick={() => setSel(d)}>{d.subject}</button></td>
            <td>{d.booking ? `${d.booking.reference} · ${etb(d.booking.total)}` : '—'}</td><td>{d.operator?.name ?? '—'}</td><td><Pill status={d.status} /></td></tr>
        ))}
      </Table>
      <Modal open={!!sel} title={sel?.subject ?? ''} onClose={() => setSel(null)}>
        {sel && <>
          <p style={{ whiteSpace: 'pre-wrap' }}>{sel.description}</p>
          {sel.booking && <p className="small muted">Booking {sel.booking.reference} · {sel.booking.status} · {etb(sel.booking.total)} · {sel.operator?.name}</p>}
          {sel.status === 'open' ? <>
            <Field label="Resolution (sent to the customer)" value={text} onChange={(e) => setText(e.target.value)} />
            <div className="row"><button className="btn btn-primary" disabled={!text} onClick={() => decide('resolved')}>Resolve</button><button className="btn btn-danger" disabled={!text} onClick={() => decide('rejected')}>Reject</button></div>
          </> : <p><strong>Resolution:</strong> {sel.resolution}</p>}
        </>}
      </Modal>
    </>
  );
}
