import { useState } from 'react';
import Field from '../../components/Field';
import { API_URL } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { etb, todayInAddis } from '../../lib/format';
import { Kpis, PageHead, Table, dateTime, useLoad } from '../ui';

type R = {
  totals: { bookings: number; tickets: number; fares: number; cancellations: number; occupancy_percent: number };
  by_route: { route: string; tickets: number; fares: number }[];
  by_channel: { channel: string; bookings: number; fares: number }[];
  by_method: { method: string; bookings: number }[];
  occupancy: { trip_id: number; departure_at: string; route: string; sold: number; capacity: number }[];
};

export default function Reports() {
  const { token } = useAuth();
  const [from, setFrom] = useState(todayInAddis(-30));
  const [to, setTo] = useState(todayInAddis());
  const [r] = useLoad<R>(`/operator/reports?from=${from}&to=${to}`);

  const csv = async () => {
    const res = await fetch(`${API_URL}/operator/reports?from=${from}&to=${to}&format=csv`, { headers: { Authorization: `Bearer ${token}` } });
    const url = URL.createObjectURL(await res.blob());
    Object.assign(document.createElement('a'), { href: url, download: `occupancy-${from}-${to}.csv` }).click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHead title="Reports" actions={<button className="btn btn-ghost" onClick={csv}>Download occupancy CSV</button>} />
      <div className="row"><Field label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /><Field label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
      {r && <>
        <Kpis items={[['Paid bookings', r.totals.bookings], ['Tickets', r.totals.tickets], ['Fares', etb(r.totals.fares)], ['Average occupancy', `${r.totals.occupancy_percent}%`], ['Cancellations', r.totals.cancellations]]} />
        <div className="split">
          <div className="main-col stack">
            <h2 style={{ fontSize: 18 }}>By route</h2>
            <Table caption="Sales by route" head={['Route', 'Tickets', 'Fares']} empty={!r.by_route.length}>{r.by_route.map((x) => <tr key={x.route}><td>{x.route}</td><td>{x.tickets}</td><td>{etb(x.fares)}</td></tr>)}</Table>
          </div>
          <div className="side-col stack">
            <h2 style={{ fontSize: 18 }}>By channel</h2>
            <Table caption="Sales by channel" head={['Channel', 'Bookings', 'Fares']} empty={!r.by_channel.length}>{r.by_channel.map((x) => <tr key={x.channel}><td>{x.channel}</td><td>{x.bookings}</td><td>{etb(x.fares)}</td></tr>)}</Table>
            <h2 style={{ fontSize: 18 }}>By payment method</h2>
            <Table caption="Bookings by payment method" head={['Method', 'Bookings']} empty={!r.by_method.length}>{r.by_method.map((x) => <tr key={x.method}><td>{x.method}</td><td>{x.bookings}</td></tr>)}</Table>
          </div>
        </div>
        <h2 style={{ fontSize: 18 }}>Occupancy per trip</h2>
        <Table caption="Occupancy per trip" head={['Departure', 'Route', 'Sold', 'Full']} empty={!r.occupancy.length}>
          {r.occupancy.map((o) => <tr key={o.trip_id}><td>{dateTime(o.departure_at)}</td><td>{o.route}</td><td>{o.sold}/{o.capacity}</td><td>{o.capacity ? Math.round(o.sold / o.capacity * 100) : 0}%</td></tr>)}
        </Table>
      </>}
    </>
  );
}
