import { useState } from 'react';
import Field from '../../components/Field';
import { PageHead, Table, dateTime, useLoad } from '../ui';

type Page = { data: { id: number; user_id: number | null; operator_id: number | null; action: string; subject_type: string | null; subject_id: number | null; meta: unknown; created_at: string }[]; current_page: number; last_page: number };

export default function Audit() {
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);
  const [d] = useLoad<Page>(`/admin/audit?page=${page}${action ? `&action=${encodeURIComponent(action)}` : ''}`);

  return (
    <>
      <PageHead title="Audit log" sub="Every change to bookings, payments, trips, staff and operators, with who did it." />
      <div style={{ maxWidth: 320 }}><Field label="Filter by action (starts with)" placeholder="e.g. booking. or admin." value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} /></div>
      <Table caption="Audit log" head={['When', 'Action', 'By user', 'Operator', 'Record', 'Details']} empty={d?.data.length === 0}>
        {d?.data.map((r) => (
          <tr key={r.id}><td>{dateTime(r.created_at)}</td><td className="mono">{r.action}</td><td>{r.user_id ?? 'system'}</td><td>{r.operator_id ?? '—'}</td>
            <td>{r.subject_type ? `${r.subject_type.split('\\').pop()} #${r.subject_id}` : '—'}</td><td className="small mono">{r.meta ? JSON.stringify(r.meta) : ''}</td></tr>
        ))}
      </Table>
      {d && d.last_page > 1 && (
        <nav className="row" aria-label="Pages">
          <button className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span>Page {d.current_page} of {d.last_page}</span>
          <button className="btn btn-ghost" disabled={page >= d.last_page} onClick={() => setPage(page + 1)}>Next</button>
        </nav>
      )}
    </>
  );
}
