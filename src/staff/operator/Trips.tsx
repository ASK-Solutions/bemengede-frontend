import { useState } from 'react';
import { Link } from 'react-router-dom';
import Field from '../../components/Field';
import { ApiError } from '../../lib/api';
import { etb, todayInAddis } from '../../lib/format';
import { Modal, Msg, PageHead, Pill, Select, Table, dateTime, useCall, useLoad } from '../ui';

type T = { id: number; departure_at: string; route: string; bus: string; driver: string | null; base_fare: number; sold: number; capacity: number; status: string; delay_minutes: number };
type R = { id: number; label: string; default_fare: number | null };
type B = { id: number; plate_number: string; side_number: string | null; status: string };
type Dr = { id: number; full_name: string; status: string };

export default function Trips() {
  const [from, setFrom] = useState(todayInAddis());
  const [to, setTo] = useState(todayInAddis(7));
  const [trips, reload] = useLoad<T[]>(`/operator/trips?from=${from}&to=${to}`);
  const [routes] = useLoad<R[]>('/operator/routes');
  const [buses] = useLoad<B[]>('/operator/buses');
  const [drivers] = useLoad<Dr[]>('/operator/drivers');
  const call = useCall();
  const [creating, setCreating] = useState(false);
  const [f, setF] = useState({ route_id: '', bus_id: '', driver_id: '', departure_local: '', base_fare_etb: '', repeat_days: '1' });
  const [action, setAction] = useState<{ kind: 'delay' | 'cancel'; trip: T } | null>(null);
  const [minutes, setMinutes] = useState('30');
  const [reason, setReason] = useState('');
  const [msg, setMsg] = useState<[string, 'ok' | 'error']>(['', 'ok']);

  const create = async () => {
    try {
      const r = await call<{ created: number }>('/operator/trips', 'POST', { ...f, driver_id: f.driver_id || null, repeat_days: +f.repeat_days });
      setMsg([`${r.created} trip(s) created.`, 'ok']); setCreating(false); reload();
    } catch (e) { setMsg([e instanceof ApiError ? (Object.values(e.errors)[0]?.[0] ?? e.message) : 'Failed', 'error']); }
  };
  const act = async () => {
    if (!action) return;
    try {
      if (action.kind === 'delay') await call(`/operator/trips/${action.trip.id}/delay`, 'POST', { minutes: +minutes, reason });
      else await call(`/operator/trips/${action.trip.id}/cancel`, 'POST', { reason });
      setMsg([action.kind === 'delay' ? 'Delay saved. Passengers were sent an SMS.' : 'Trip cancelled. Every passenger gets a full refund and an SMS.', 'ok']);
      setAction(null); setReason(''); reload();
    } catch (e) { setMsg([e instanceof ApiError ? e.message : 'Failed', 'error']); }
  };
  const pickRoute = (v: string) => {
    const r = routes?.find((x) => x.id === +v);
    setF({ ...f, route_id: v, base_fare_etb: f.base_fare_etb || (r?.default_fare ? String(r.default_fare / 100) : '') });
  };

  return (
    <>
      <PageHead title="Trips & schedules" actions={<button className="btn btn-primary" onClick={() => setCreating(true)}>+ New trip</button>} />
      <Msg text={msg[0]} kind={msg[1]} />
      <div className="row">
        <Field label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Field label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>
      <Table caption="Trips" head={['Departure', 'Route', 'Bus', 'Driver', 'Fare', 'Sold', 'Status', 'Actions']} empty={trips?.length === 0}>
        {trips?.map((t) => (
          <tr key={t.id}>
            <td><strong>{dateTime(t.departure_at)}</strong>{t.delay_minutes > 0 && <><br /><span className="small">delayed {t.delay_minutes} min</span></>}</td>
            <td>{t.route}</td><td>{t.bus}</td><td>{t.driver ?? '—'}</td><td>{etb(t.base_fare)}</td>
            <td>{t.sold}/{t.capacity}</td><td><Pill status={t.status} /></td>
            <td>
              <div className="row" style={{ gap: 6 }}>
                <Link to={`/operator/boarding?trip=${t.id}`} aria-label={`Manifest for ${t.route} ${dateTime(t.departure_at)}`}>Manifest</Link>
                {t.status === 'scheduled' && <>
                  <button className="linklike" onClick={() => setAction({ kind: 'delay', trip: t })}>Delay</button>
                  <button className="linklike" style={{ color: 'var(--danger)' }} onClick={() => setAction({ kind: 'cancel', trip: t })}>Cancel</button>
                </>}
              </div>
            </td>
          </tr>
        ))}
      </Table>

      <Modal open={creating} title="New trip" onClose={() => setCreating(false)}>
        {!routes?.length && <p className="alert">Add a route first under <Link to="/operator/routes">Routes</Link>.</p>}
        <Select label="Route" value={f.route_id} onChange={pickRoute} options={(routes ?? []).map((r) => [r.id, r.label])} required />
        <Select label="Bus" value={f.bus_id} onChange={(v) => setF({ ...f, bus_id: v })} options={(buses ?? []).filter((b) => b.status === 'active').map((b) => [b.id, `${b.side_number ?? ''} ${b.plate_number}`.trim()])} required />
        <Select label="Driver (optional)" value={f.driver_id} onChange={(v) => setF({ ...f, driver_id: v })} options={(drivers ?? []).filter((d) => d.status === 'active').map((d) => [d.id, d.full_name])} />
        <Field label="Departure (Addis Ababa time)" type="datetime-local" value={f.departure_local} onChange={(e) => setF({ ...f, departure_local: e.target.value })} required />
        <Field label="Adult fare (ETB)" hint="The service fee is added on top and shown to travellers as one all-in price." type="number" min={1} value={f.base_fare_etb} onChange={(e) => setF({ ...f, base_fare_etb: e.target.value })} required />
        <Field label="Repeat daily for how many days" type="number" min={1} max={60} value={f.repeat_days} onChange={(e) => setF({ ...f, repeat_days: e.target.value })} />
        <button className="btn btn-primary" onClick={create}>Create</button>
      </Modal>

      <Modal open={!!action} title={action?.kind === 'delay' ? 'Delay trip' : 'Cancel trip'} onClose={() => setAction(null)}>
        {action && <p>{action.trip.route} · {dateTime(action.trip.departure_at)} · {action.trip.sold} passengers</p>}
        {action?.kind === 'delay'
          ? <Field label="Delay (minutes)" type="number" min={5} value={minutes} onChange={(e) => setMinutes(e.target.value)} />
          : <p className="alert">Every passenger gets a full refund, including the service fee, and an SMS.</p>}
        <Field label="Reason (shown in the audit log)" value={reason} onChange={(e) => setReason(e.target.value)} required={action?.kind === 'cancel'} />
        <button className={`btn ${action?.kind === 'cancel' ? 'btn-danger' : 'btn-primary'}`} onClick={act}>{action?.kind === 'delay' ? 'Save delay and notify' : 'Cancel trip and refund'}</button>
      </Modal>
    </>
  );
}
