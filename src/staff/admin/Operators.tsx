import { useState } from 'react';
import Field from '../../components/Field';
import { API_URL, ApiError } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { Modal, Msg, PageHead, Pill, Table, useCall, useLoad } from '../ui';

type Row = { id: number; name: string; slug: string; status: string; partnership_signed_at: string | null; steps_done: number; steps_total: number };
type Detail = Row & Record<string, unknown> & {
  legal_name: string | null; tin: string | null; trade_license_no: string | null; operating_license_no: string | null; chapa_subaccount_id: string | null; commission_percent: number | null; commission_effective: number;
  checklist: { key: string; label: string; done: boolean }[]; documents: { id: number; type: string; status: string; note: string | null }[];
  accounts: { bank: string; account_name: string; account_number: string }[]; staff: { id: number; name: string; email: string; role: string }[];
  counts: { buses: number; routes: number; trips_upcoming: number };
};
const FILTERS: [string, string][] = [['all', 'All'], ['active', 'Active'], ['applying', 'Applying'], ['invited', 'Invited'], ['suspended', 'Suspended']];

export default function Operators() {
  const { token } = useAuth();
  const [rows, reload] = useLoad<Row[]>('/admin/operators');
  const call = useCall();
  const [filter, setFilter] = useState('all');
  const [sel, setSel] = useState<Detail | null>(null);
  const [edit, setEdit] = useState<Record<string, string>>({});
  const [invite, setInvite] = useState<Record<string, string> | null>(null);
  const [signed, setSigned] = useState(false);
  const [msg, setMsg] = useState<[string, 'ok' | 'error']>(['', 'ok']);

  const open = async (id: number) => {
    const d = await call<Detail>(`/admin/operators/${id}`, 'GET');
    setSel(d); setSigned(!!d.partnership_signed_at); setMsg(['', 'ok']);
    setEdit({ legal_name: d.legal_name ?? '', tin: d.tin ?? '', trade_license_no: d.trade_license_no ?? '', operating_license_no: d.operating_license_no ?? '', chapa_subaccount_id: d.chapa_subaccount_id ?? '', commission_percent: d.commission_percent == null ? '' : String(d.commission_percent) });
  };
  const err = (e: unknown) => setMsg([e instanceof ApiError ? (Object.values(e.errors)[0]?.[0] ?? e.message) : 'Failed', 'error']);
  const save = async () => { try { setSel(await call<Detail>(`/admin/operators/${sel!.id}`, 'PATCH', { ...edit, commission_percent: edit.commission_percent === '' ? null : +edit.commission_percent })); setMsg(['Saved.', 'ok']); reload(); } catch (e) { err(e); } };
  const status = async (s: string) => { try { setSel(await call<Detail>(`/admin/operators/${sel!.id}/status`, 'POST', { status: s, partnership_signed: signed })); setMsg([`Status set to ${s}.`, 'ok']); reload(); } catch (e) { err(e); } };
  const doc = async (id: number, s: 'approved' | 'rejected') => { await call(`/admin/documents/${id}`, 'POST', { status: s }); open(sel!.id); };
  const viewDoc = async (id: number) => {
    const res = await fetch(`${API_URL}/admin/documents/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    window.open(URL.createObjectURL(await res.blob()), '_blank', 'noopener');
  };
  const sendInvite = async () => { try { await call(`/admin/operators/${sel!.id}/owner`, 'POST', invite); setInvite(null); setMsg(['Owner invitation emailed.', 'ok']); } catch (e) { err(e); } };

  const shown = (rows ?? []).filter((r) => filter === 'all' || (filter === 'applying' ? ['applied', 'under_review'].includes(r.status) : r.status === filter));

  return (
    <>
      <PageHead title="Operators" sub="An operator goes live only when every onboarding step is done. It is named publicly only after the partnership agreement is signed." />
      <div className="tabs" role="group" aria-label="Filter operators">
        {FILTERS.map(([k, l]) => <button key={k} className="chip" aria-pressed={filter === k} onClick={() => setFilter(k)}>{l} ({(rows ?? []).filter((r) => k === 'all' || (k === 'applying' ? ['applied', 'under_review'].includes(r.status) : r.status === k)).length})</button>)}
      </div>
      <div className="split">
        <div className="main-col">
          <Table caption="Operators" head={['Operator', 'Onboarding', 'Agreement', 'Status']} empty={!shown.length}>
            {shown.map((r) => (
              <tr key={r.id} aria-selected={sel?.id === r.id}>
                <td><button className="linklike" onClick={() => open(r.id)}>{r.name}</button><br /><span className="small muted">{r.slug}</span></td>
                <td>{r.steps_done}/{r.steps_total}</td><td>{r.partnership_signed_at ? 'Signed' : '—'}</td><td><Pill status={r.status} /></td>
              </tr>
            ))}
          </Table>
        </div>
        <aside className="side-col card stack" aria-live="polite">
          {!sel ? <p className="muted">Choose an operator.</p> : <>
            <h2 style={{ fontSize: 20 }}>{sel.name}</h2>
            <p><Pill status={sel.status} /> · {sel.counts.buses} buses · {sel.counts.routes} routes · {sel.counts.trips_upcoming} upcoming trips</p>
            <Msg text={msg[0]} kind={msg[1]} />
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }} className="stack">
              {sel.checklist.map((c) => <li key={c.key} className="check"><span className={`pill-s ${c.done ? 'ok' : 'neutral'}`}>{c.done ? 'Done' : 'To do'}</span>{c.label}</li>)}
            </ul>
            <label className="check"><input type="checkbox" checked={signed} onChange={(e) => setSigned(e.target.checked)} /><span>The partnership agreement is signed (I have the signed copy).</span></label>
            <div className="row">
              <button className="btn btn-primary" onClick={() => status('active')}>Go live</button>
              <button className="btn btn-ghost" onClick={() => status('under_review')}>Mark in review</button>
              <button className="btn btn-danger" onClick={() => status('suspended')}>Suspend</button>
            </div>
            <details><summary style={{ fontWeight: 700, cursor: 'pointer' }}>Legal & commercial details</summary>
              <div className="stack" style={{ marginTop: 10 }}>
                {[['legal_name', 'Registered name'], ['tin', 'TIN'], ['trade_license_no', 'Trade licence'], ['operating_license_no', 'Operating licence'], ['chapa_subaccount_id', 'Chapa subaccount ID'], ['commission_percent', `Commission % (blank = default ${sel.commission_effective}%)`]].map(([k, l]) => (
                  <Field key={k} label={l} value={edit[k] ?? ''} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} />
                ))}
                <button className="btn btn-ghost" onClick={save}>Save details</button>
              </div>
            </details>
            <h3 style={{ fontSize: 16 }}>Documents</h3>
            {sel.documents.length ? sel.documents.map((d) => (
              <div key={d.id} className="row between">
                <button className="linklike" onClick={() => viewDoc(d.id)}>{d.type.replace('_', ' ')}</button><Pill status={d.status} />
                {d.status === 'pending' && <span className="row" style={{ gap: 6 }}><button className="linklike" onClick={() => doc(d.id, 'approved')}>Approve</button><button className="linklike" style={{ color: 'var(--danger)' }} onClick={() => doc(d.id, 'rejected')}>Reject</button></span>}
              </div>
            )) : <p className="muted small">No documents uploaded.</p>}
            <h3 style={{ fontSize: 16 }}>Staff</h3>
            {sel.staff.map((s) => <p key={s.id} className="small">{s.name} · {s.email} · {s.role.replace('operator_', '')}</p>)}
            <button className="btn btn-ghost" onClick={() => setInvite({ name: '', email: '', phone: '' })}>Invite owner</button>
          </>}
        </aside>
      </div>
      <Modal open={!!invite} title={`Invite owner for ${sel?.name ?? ''}`} onClose={() => setInvite(null)}>
        {invite && <>
          <Field label="Name" value={invite.name} onChange={(e) => setInvite({ ...invite, name: e.target.value })} />
          <Field label="Email" type="email" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} />
          <Field label="Mobile" type="tel" value={invite.phone} onChange={(e) => setInvite({ ...invite, phone: e.target.value })} />
          <button className="btn btn-primary" onClick={sendInvite}>Send invitation</button>
        </>}
      </Modal>
    </>
  );
}
