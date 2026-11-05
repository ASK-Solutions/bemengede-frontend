import { useState } from 'react';
import Field from '../../components/Field';
import { ApiError } from '../../lib/api';
import { Modal, Msg, PageHead, Pill, Select, Table, useCall, useLoad } from '../ui';

type Bus = { id: number; plate_number: string; side_number: string | null; class: string; seat_count: number; layout: { columns: number; aisle_after: number }; amenities: string[] | null; status: string };
type Driver = { id: number; full_name: string; phone: string; license_no: string; license_expires_on: string; status: string };
const AMENITIES = ['ac', 'wifi', 'usb', 'toilet', 'tv'];

export default function Fleet() {
  const [tab, setTab] = useState<'buses' | 'drivers'>('buses');
  const [buses, reloadBuses] = useLoad<Bus[]>('/operator/buses');
  const [drivers, reloadDrivers] = useLoad<Driver[]>('/operator/drivers');
  const call = useCall();
  const [msg, setMsg] = useState<[string, 'ok' | 'error']>(['', 'ok']);
  const [busForm, setBusForm] = useState<Record<string, string | string[]> | null>(null);
  const [drvForm, setDrvForm] = useState<Record<string, string> | null>(null);

  const err = (e: unknown) => setMsg([e instanceof ApiError ? (Object.values(e.errors)[0]?.[0] ?? e.message) : 'Failed', 'error']);
  const saveBus = async () => {
    if (!busForm) return;
    const body = { ...busForm, seat_count: +busForm.seat_count, columns: +busForm.columns, aisle_after: +busForm.aisle_after };
    try {
      await call(busForm.id ? `/operator/buses/${busForm.id}` : '/operator/buses', busForm.id ? 'PATCH' : 'POST', body);
      setBusForm(null); setMsg(['Bus saved.', 'ok']); reloadBuses();
    } catch (e) { err(e); }
  };
  const removeBus = async (b: Bus) => { try { await call(`/operator/buses/${b.id}`, 'DELETE'); setMsg(['Bus removed.', 'ok']); reloadBuses(); } catch (e) { err(e); } };
  const saveDriver = async () => {
    if (!drvForm) return;
    try {
      await call(drvForm.id ? `/operator/drivers/${drvForm.id}` : '/operator/drivers', drvForm.id ? 'PATCH' : 'POST', drvForm);
      setDrvForm(null); setMsg(['Driver saved.', 'ok']); reloadDrivers();
    } catch (e) { err(e); }
  };
  const soon = (d: string) => new Date(d).getTime() - Date.now() < 30 * 86400000;

  return (
    <>
      <PageHead title="Fleet & drivers" actions={tab === 'buses'
        ? <button className="btn btn-primary" onClick={() => setBusForm({ plate_number: '', side_number: '', class: 'standard', seat_count: '51', columns: '4', aisle_after: '2', amenities: [] })}>+ Add bus</button>
        : <button className="btn btn-primary" onClick={() => setDrvForm({ full_name: '', phone: '', license_no: '', license_expires_on: '' })}>+ Add driver</button>} />
      <div className="tabs" role="group" aria-label="Show">
        <button className="chip" aria-pressed={tab === 'buses'} onClick={() => setTab('buses')}>Buses</button>
        <button className="chip" aria-pressed={tab === 'drivers'} onClick={() => setTab('drivers')}>Drivers</button>
      </div>
      <Msg text={msg[0]} kind={msg[1]} />
      {tab === 'buses' ? (
        <Table caption="Buses" head={['Bus', 'Class', 'Seats', 'Amenities', 'Status', '']} empty={buses?.length === 0}>
          {buses?.map((b) => (
            <tr key={b.id}>
              <td><strong>{b.side_number ?? '—'}</strong><br /><span className="small muted">{b.plate_number}</span></td>
              <td>{b.class.toUpperCase()}</td><td>{b.seat_count} ({b.layout.aisle_after}+{b.layout.columns - b.layout.aisle_after})</td>
              <td>{(b.amenities ?? []).join(', ').toUpperCase() || '—'}</td><td><Pill status={b.status} /></td>
              <td className="row" style={{ gap: 8 }}>
                <button className="linklike" onClick={() => setBusForm({ id: String(b.id), plate_number: b.plate_number, side_number: b.side_number ?? '', class: b.class, seat_count: String(b.seat_count), columns: String(b.layout.columns), aisle_after: String(b.layout.aisle_after), amenities: b.amenities ?? [], status: b.status })}>Edit</button>
                <button className="linklike" style={{ color: 'var(--danger)' }} onClick={() => removeBus(b)}>Remove</button>
              </td>
            </tr>
          ))}
        </Table>
      ) : (
        <Table caption="Drivers" head={['Name', 'Phone', 'Licence', 'Expires', 'Status', '']} empty={drivers?.length === 0}>
          {drivers?.map((d) => (
            <tr key={d.id}>
              <td>{d.full_name}</td><td>{d.phone}</td><td>{d.license_no}</td>
              <td>{new Date(d.license_expires_on).toLocaleDateString('en-GB')}{soon(d.license_expires_on) && <> <span className="pill-s warn">Renew soon</span></>}</td>
              <td><Pill status={d.status} /></td>
              <td><button className="linklike" onClick={() => setDrvForm({ id: String(d.id), full_name: d.full_name, phone: d.phone, license_no: d.license_no, license_expires_on: d.license_expires_on.slice(0, 10), status: d.status })}>Edit</button></td>
            </tr>
          ))}
        </Table>
      )}

      <Modal open={!!busForm} title={busForm?.id ? 'Edit bus' : 'Add bus'} onClose={() => setBusForm(null)}>
        {busForm && <>
          <Field label="Plate number" value={busForm.plate_number as string} onChange={(e) => setBusForm({ ...busForm, plate_number: e.target.value })} required />
          <Field label="Side number (optional)" value={busForm.side_number as string} onChange={(e) => setBusForm({ ...busForm, side_number: e.target.value })} />
          <Select label="Class" value={busForm.class as string} onChange={(v) => setBusForm({ ...busForm, class: v })} options={[['standard', 'Standard'], ['vip', 'VIP']]} />
          <div className="row">
            <Field label="Seats" type="number" min={10} max={80} value={busForm.seat_count as string} onChange={(e) => setBusForm({ ...busForm, seat_count: e.target.value })} />
            <Field label="Seats per row" type="number" min={3} max={5} value={busForm.columns as string} onChange={(e) => setBusForm({ ...busForm, columns: e.target.value })} />
            <Field label="Aisle after seat" type="number" min={1} max={4} value={busForm.aisle_after as string} onChange={(e) => setBusForm({ ...busForm, aisle_after: e.target.value })} />
          </div>
          <fieldset className="row" style={{ border: 'none', padding: 0 }}>
            <legend className="small" style={{ fontWeight: 700 }}>Amenities</legend>
            {AMENITIES.map((a) => {
              const list = busForm.amenities as string[];
              return <label key={a} className="check"><input type="checkbox" checked={list.includes(a)} onChange={(e) => setBusForm({ ...busForm, amenities: e.target.checked ? [...list, a] : list.filter((x) => x !== a) })} /><span>{a.toUpperCase()}</span></label>;
            })}
          </fieldset>
          {busForm.id && <Select label="Status" value={busForm.status as string} onChange={(v) => setBusForm({ ...busForm, status: v })} options={[['active', 'Active'], ['maintenance', 'In maintenance'], ['retired', 'Retired']]} />}
          <button className="btn btn-primary" onClick={saveBus}>Save bus</button>
        </>}
      </Modal>

      <Modal open={!!drvForm} title={drvForm?.id ? 'Edit driver' : 'Add driver'} onClose={() => setDrvForm(null)}>
        {drvForm && <>
          <Field label="Full name" value={drvForm.full_name} onChange={(e) => setDrvForm({ ...drvForm, full_name: e.target.value })} required />
          <Field label="Phone" type="tel" value={drvForm.phone} onChange={(e) => setDrvForm({ ...drvForm, phone: e.target.value })} required />
          <Field label="Driving licence number" value={drvForm.license_no} onChange={(e) => setDrvForm({ ...drvForm, license_no: e.target.value })} required />
          <Field label="Licence expires on" type="date" value={drvForm.license_expires_on} onChange={(e) => setDrvForm({ ...drvForm, license_expires_on: e.target.value })} required />
          {drvForm.id && <Select label="Status" value={drvForm.status} onChange={(v) => setDrvForm({ ...drvForm, status: v })} options={[['active', 'Active'], ['inactive', 'Inactive']]} />}
          <button className="btn btn-primary" onClick={saveDriver}>Save driver</button>
        </>}
      </Modal>
    </>
  );
}
