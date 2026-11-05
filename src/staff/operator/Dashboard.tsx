import { Link } from 'react-router-dom';
import { etb } from '../../lib/format';
import { Kpis, PageHead, Pill, Table, dateTime, useLoad } from '../ui';

type D = {
  kpis: { departures_today: number; seats_sold_today: number; capacity_today: number; revenue_today: number; pending_verifications: number };
  departures: { id: number; departure_at: string; route: string; bus: string; driver: string | null; sold: number; capacity: number; status: string; delay_minutes: number }[];
  payment_mix_7d: Record<string, number>;
  alerts: { type: string; text: string }[];
};
const COLORS: Record<string, string> = { telebirr: '#1E6B57', chapa: '#2B5BA8', transfer: '#B7791F', cash: '#6B7570' };

export default function Dashboard() {
  const [d, , err] = useLoad<D>('/operator/dashboard');
  if (err) return <p className="alert alert-error">{err}</p>;
  if (!d) return <p>Loading…</p>;
  const k = d.kpis;
  const mixTotal = Object.values(d.payment_mix_7d).reduce((a, b) => a + b, 0);

  return (
    <>
      <PageHead title="Dashboard" sub={new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Africa/Addis_Ababa' })}
        actions={<><Link className="btn btn-ghost" to="/operator/counter">Counter sale</Link><Link className="btn btn-primary" to="/operator/trips">Trips</Link></>} />
      <Kpis items={[
        ['Departures today', k.departures_today],
        ['Seats sold today', `${k.seats_sold_today} / ${k.capacity_today}`, k.capacity_today ? `${Math.round(k.seats_sold_today / k.capacity_today * 100)}% full` : undefined],
        ['Paid today', etb(k.revenue_today), 'All channels, including service fee'],
        ['Transfers to review', k.pending_verifications],
      ]} />
      <div className="split">
        <section className="main-col stack" aria-labelledby="dep">
          <h2 id="dep" style={{ fontSize: 20 }}>Today’s departures</h2>
          <Table caption="Today's departures" head={['Time', 'Route', 'Bus', 'Driver', 'Sold', 'Status', '']} empty={!d.departures.length}>
            {d.departures.map((t) => (
              <tr key={t.id}>
                <td><strong>{dateTime(t.departure_at).split(', ').pop()}</strong>{t.delay_minutes > 0 && <><br /><span className="small">+{t.delay_minutes} min</span></>}</td>
                <td>{t.route}</td><td>{t.bus}</td><td>{t.driver ?? '—'}</td>
                <td>{t.sold}/{t.capacity}</td><td><Pill status={t.status} /></td>
                <td><Link to={`/operator/boarding?trip=${t.id}`}>Manifest</Link></td>
              </tr>
            ))}
          </Table>
        </section>
        <section className="side-col stack">
          <div className="card stack">
            <h2 style={{ fontSize: 18 }}>Payment methods, last 7 days</h2>
            {mixTotal ? (
              <>
                <div className="bar-h" aria-hidden="true">{Object.entries(d.payment_mix_7d).map(([k2, n]) => <div key={k2} style={{ flex: n, background: COLORS[k2] ?? '#6B7570' }} />)}</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {Object.entries(d.payment_mix_7d).map(([k2, n]) => <li key={k2} className="row between small"><span className="row" style={{ gap: 6 }}><span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 5, background: COLORS[k2] }} />{k2}</span><strong>{n} ({Math.round(n / mixTotal * 100)}%)</strong></li>)}
                </ul>
              </>
            ) : <p className="muted small">No payments yet.</p>}
          </div>
          <div className="card stack">
            <h2 style={{ fontSize: 18 }}>Needs attention</h2>
            {d.alerts.length ? d.alerts.map((a, i) => (
              <p key={i} className="alert" style={{ fontWeight: 500 }}>{a.type === 'verifications' ? <Link to="/operator/verifications">{a.text}</Link> : a.text}</p>
            )) : <p className="muted small">All clear.</p>}
          </div>
        </section>
      </div>
    </>
  );
}
