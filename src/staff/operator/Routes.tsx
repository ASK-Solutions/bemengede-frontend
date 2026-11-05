import { useState } from 'react';
import Field from '../../components/Field';
import { ApiError } from '../../lib/api';
import { etb } from '../../lib/format';
import { Modal, Msg, PageHead, Select, Table, useCall, useLoad } from '../ui';

type R = { id: number; label: string; distance_km: number; duration_minutes: number; default_fare: number | null; stops: string[] | null };
type Tm = { id: number; name: string; city: { name_en: string } };

export default function Routes() {
  const [routes, reload] = useLoad<R[]>('/operator/routes');
  const [terminals] = useLoad<Tm[]>('/operator/terminals');
  const call = useCall();
  const [f, setF] = useState<Record<string, string> | null>(null);
  const [msg, setMsg] = useState<[string, 'ok' | 'error']>(['', 'ok']);
  const tOpts: [number, string][] = (terminals ?? []).map((t) => [t.id, `${t.city.name_en} · ${t.name}`]);

  const save = async () => {
    if (!f) return;
    try {
      await call('/operator/routes', 'POST', { ...f, distance_km: +f.distance_km, duration_minutes: Math.round(+f.hours * 60), default_fare_etb: f.default_fare_etb ? +f.default_fare_etb : null, stops: f.stops ? f.stops.split(',').map((s) => s.trim()).filter(Boolean) : [] });
      setF(null); setMsg(['Route added.', 'ok']); reload();
    } catch (e) { setMsg([e instanceof ApiError ? (Object.values(e.errors)[0]?.[0] ?? e.message) : 'Failed', 'error']); }
  };

  return (
    <>
      <PageHead title="Routes" sub="Terminals are shared across Bemengede. Ask the platform team to add a missing one." actions={<button className="btn btn-primary" onClick={() => setF({ origin_terminal_id: '', destination_terminal_id: '', distance_km: '', hours: '', default_fare_etb: '', stops: '' })}>+ Add route</button>} />
      <Msg text={msg[0]} kind={msg[1]} />
      <Table caption="Routes" head={['Route', 'Distance', 'Duration', 'Usual fare', 'Stops']} empty={routes?.length === 0}>
        {routes?.map((r) => (
          <tr key={r.id}><td>{r.label}</td><td>{r.distance_km} km</td><td>{Math.floor(r.duration_minutes / 60)} h {r.duration_minutes % 60 || ''}</td><td>{r.default_fare ? etb(r.default_fare) : '—'}</td><td>{(r.stops ?? []).join(', ') || '—'}</td></tr>
        ))}
      </Table>
      <Modal open={!!f} title="Add route" onClose={() => setF(null)}>
        {f && <>
          <Select label="From terminal" value={f.origin_terminal_id} onChange={(v) => setF({ ...f, origin_terminal_id: v })} options={tOpts} />
          <Select label="To terminal" value={f.destination_terminal_id} onChange={(v) => setF({ ...f, destination_terminal_id: v })} options={tOpts} />
          <div className="row">
            <Field label="Distance (km)" type="number" value={f.distance_km} onChange={(e) => setF({ ...f, distance_km: e.target.value })} />
            <Field label="Duration (hours)" type="number" step="0.25" value={f.hours} onChange={(e) => setF({ ...f, hours: e.target.value })} />
          </div>
          <Field label="Usual adult fare (ETB, optional)" type="number" value={f.default_fare_etb} onChange={(e) => setF({ ...f, default_fare_etb: e.target.value })} />
          <Field label="Stops on the way (comma separated)" value={f.stops} onChange={(e) => setF({ ...f, stops: e.target.value })} />
          <button className="btn btn-primary" onClick={save}>Save route</button>
        </>}
      </Modal>
    </>
  );
}
