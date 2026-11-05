import { Link } from 'react-router-dom';
import { etb } from '../../lib/format';
import { Kpis, PageHead, Table, useLoad } from '../ui';

type O = {
  gross_this_month: number; paid_bookings_this_month: number; operators: Record<string, number>;
  pending_transfer_reviews: number; open_disputes: number; refunds_due: number; payment_mix: Record<string, number>;
  bookings_by_day: { date: string; bookings: number }[]; top_operators: { operator: string; bookings: number; gross: number }[];
};

export default function Overview() {
  const [o, , err] = useLoad<O>('/admin/overview');
  if (err) return <p className="alert alert-error">{err}</p>;
  if (!o) return <p>Loading…</p>;
  const max = Math.max(1, ...o.bookings_by_day.map((d) => d.bookings));
  const ops = (s: string) => o.operators[s] ?? 0;

  return (
    <>
      <PageHead title="Platform overview" sub="This month, Addis Ababa time" />
      <Kpis items={[
        ['Paid this month', etb(o.gross_this_month), `${o.paid_bookings_this_month} payments`],
        ['Active operators', ops('active'), `${ops('applied') + ops('under_review')} applying · ${ops('invited')} invited`],
        ['Transfers waiting for operators', o.pending_transfer_reviews],
        ['Open disputes', o.open_disputes, o.refunds_due ? `${o.refunds_due} refunds due` : undefined],
      ]} />
      <section className="card stack" aria-labelledby="bd">
        <h2 id="bd" style={{ fontSize: 18 }}>Paid bookings, last 14 days</h2>
        <div className="row" style={{ alignItems: 'flex-end', height: 160, gap: 6, flexWrap: 'nowrap' }} aria-hidden="true">
          {o.bookings_by_day.map((d) => (
            <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
              <span className="small muted">{d.bookings}</span>
              <div style={{ width: '100%', maxWidth: 36, height: `${(d.bookings / max) * 110}px`, minHeight: 2, background: 'var(--green)', borderRadius: '6px 6px 2px 2px' }} />
              <span className="small muted">{d.date.slice(8)}</span>
            </div>
          ))}
        </div>
        <table className="sr-only"><caption>Paid bookings per day</caption><tbody>{o.bookings_by_day.map((d) => <tr key={d.date}><th>{d.date}</th><td>{d.bookings}</td></tr>)}</tbody></table>
      </section>
      <div className="split">
        <div className="main-col stack">
          <h2 style={{ fontSize: 18 }}>Top operators this month</h2>
          <Table caption="Top operators" head={['Operator', 'Bookings', 'Collected']} empty={!o.top_operators.length}>
            {o.top_operators.map((t) => <tr key={t.operator}><td>{t.operator}</td><td>{t.bookings}</td><td>{etb(t.gross)}</td></tr>)}
          </Table>
        </div>
        <div className="side-col card stack">
          <h2 style={{ fontSize: 18 }}>Payment methods</h2>
          {Object.entries(o.payment_mix).map(([k, n]) => <p key={k} className="row between"><span>{k}</span><strong>{n}</strong></p>)}
          {!Object.keys(o.payment_mix).length && <p className="muted small">No payments yet.</p>}
          <Link to="/admin/payments">Payment providers →</Link>
        </div>
      </div>
    </>
  );
}
