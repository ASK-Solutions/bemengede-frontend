import { useState } from 'react';
import Field from '../../components/Field';
import { ApiError } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { Modal, Msg, PageHead, Select, Table, useCall, useLoad } from '../ui';

type S = { members: { id: number; name: string; email: string; phone: string; role: string }[]; invitations: { id: number; name: string; email: string; role: string; expires_at: string }[] };

export default function Staff() {
  const { user } = useAuth();
  const [s, reload] = useLoad<S>('/operator/staff');
  const call = useCall();
  const [f, setF] = useState<Record<string, string> | null>(null);
  const [msg, setMsg] = useState<[string, 'ok' | 'error']>(['', 'ok']);
  const isOwner = user?.role === 'operator_owner';

  const invite = async () => {
    try { await call('/operator/staff', 'POST', f); setF(null); setMsg(['Invitation emailed. It is valid for 7 days.', 'ok']); reload(); }
    catch (e) { setMsg([e instanceof ApiError ? (Object.values(e.errors)[0]?.[0] ?? e.message) : 'Failed', 'error']); }
  };
  const remove = async (id: number) => { await call(`/operator/staff/${id}`, 'DELETE'); setMsg(['Access removed.', 'ok']); reload(); };

  return (
    <>
      <PageHead title="Staff & roles" sub="Owners manage everything. Agents sell at the counter, look up bookings, review transfers and board passengers."
        actions={isOwner && <button className="btn btn-primary" onClick={() => setF({ name: '', email: '', phone: '', role: 'operator_agent' })}>+ Invite staff</button>} />
      <Msg text={msg[0]} kind={msg[1]} />
      <Table caption="Staff" head={['Name', 'Email', 'Phone', 'Role', '']} empty={s?.members.length === 0}>
        {s?.members.map((m) => (
          <tr key={m.id}><td>{m.name}</td><td>{m.email}</td><td>{m.phone}</td><td>{m.role === 'operator_owner' ? 'Owner' : 'Agent'}</td>
            <td>{isOwner && m.id !== user?.id && <button className="linklike" style={{ color: 'var(--danger)' }} onClick={() => remove(m.id)}>Remove access</button>}</td></tr>
        ))}
      </Table>
      {!!s?.invitations.length && <>
        <h2 style={{ fontSize: 18 }}>Waiting to accept</h2>
        <Table caption="Pending invitations" head={['Name', 'Email', 'Role', 'Expires']}>
          {s.invitations.map((i) => <tr key={i.id}><td>{i.name}</td><td>{i.email}</td><td>{i.role.replace('operator_', '')}</td><td>{new Date(i.expires_at).toLocaleDateString('en-GB')}</td></tr>)}
        </Table>
      </>}
      <Modal open={!!f} title="Invite staff" onClose={() => setF(null)}>
        {f && <>
          <Field label="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <Field label="Work email" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          <Field label="Mobile" type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
          <Select label="Role" value={f.role} onChange={(v) => setF({ ...f, role: v })} options={[['operator_agent', 'Agent'], ['operator_owner', 'Owner']]} />
          <button className="btn btn-primary" onClick={invite}>Send invitation</button>
        </>}
      </Modal>
    </>
  );
}
