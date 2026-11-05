import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import Field from '../../components/Field';
import { ApiError } from '../../lib/api';
import { todayInAddis } from '../../lib/format';
import { Msg, PageHead, Select, Table, dateTime, useCall, useLoad } from '../ui';

type T = { id: number; departure_at: string; route: string };
type M = { passengers: { seat: number; name: string; fare_category: string; booking: string; channel: string; boarded: boolean }[]; boarded: number };

export default function Boarding() {
  const [params, setParams] = useSearchParams();
  const tripId = params.get('trip') ?? '';
  const [trips] = useLoad<T[]>(`/operator/trips?from=${todayInAddis(-1)}&to=${todayInAddis(2)}`);
  const [m, reload] = useLoad<M>(tripId ? `/operator/trips/${tripId}/manifest` : null);
  const call = useCall();
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState<[string, 'ok' | 'error']>(['', 'ok']);
  const [scanning, setScanning] = useState(false);
  const video = useRef<HTMLVideoElement>(null);

  const board = async (qr: string) => {
    try {
      const r = await call<{ name: string; seat: number }>('/operator/board', 'POST', { qr: qr.trim() });
      setMsg([`Boarded: ${r.name}, seat ${r.seat}.`, 'ok']); setCode(''); reload();
    } catch (e) { setMsg([e instanceof ApiError ? e.message : 'Not valid', 'error']); }
  };
  const submit = (e: FormEvent) => { e.preventDefault(); board(code); };

  // Camera scanning where the browser supports BarcodeDetector; typing the code always works.
  useEffect(() => {
    if (!scanning) return;
    const BD = (window as unknown as { BarcodeDetector?: new (o: object) => { detect: (v: HTMLVideoElement) => Promise<{ rawValue: string }[]> } }).BarcodeDetector;
    if (!BD) { setMsg(['This browser can’t scan. Type the code under the QR instead.', 'error']); setScanning(false); return; }
    let stop = false; let stream: MediaStream | null = null;
    const detector = new BD({ formats: ['qr_code'] });
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(async (s) => {
      stream = s; if (video.current) { video.current.srcObject = s; await video.current.play(); }
      const loop = async () => {
        if (stop || !video.current) return;
        const found = await detector.detect(video.current).catch(() => []);
        if (found[0]) { await board(found[0].rawValue); }
        setTimeout(loop, 600);
      };
      loop();
    }).catch(() => { setMsg(['Camera permission was not given.', 'error']); setScanning(false); });
    return () => { stop = true; stream?.getTracks().forEach((t) => t.stop()); };
  }, [scanning]); // eslint-disable-line

  return (
    <>
      <PageHead title="Boarding & manifests" actions={m && <button className="btn btn-ghost" onClick={() => window.print()}>Print manifest</button>} />
      <Select label="Trip" value={tripId} onChange={(v) => setParams(v ? { trip: v } : {})} options={(trips ?? []).map((t) => [t.id, `${dateTime(t.departure_at)} · ${t.route}`])} />
      <form className="row" onSubmit={submit} style={{ alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: 240 }}><Field label="Ticket code" hint="Scan the QR or type the code, e.g. BM-7K3Q9P:…" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" /></div>
        <button className="btn btn-primary" disabled={!code}>Board</button>
        <button type="button" className="btn btn-ghost" onClick={() => setScanning((s) => !s)}>{scanning ? 'Stop camera' : 'Scan with camera'}</button>
      </form>
      {scanning && <video ref={video} muted playsInline style={{ width: '100%', maxWidth: 420, borderRadius: 12 }} aria-label="Camera preview for scanning tickets" />}
      <Msg text={msg[0]} kind={msg[1]} />
      {m && (
        <>
          <p><strong>{m.boarded}</strong> of {m.passengers.length} boarded</p>
          <Table caption="Passenger manifest" head={['Seat', 'Name', 'Fare', 'Booking', 'Channel', 'Boarded']} empty={!m.passengers.length}>
            {m.passengers.map((p) => (
              <tr key={p.seat}><td>{p.seat}</td><td>{p.name}</td><td>{p.fare_category}</td><td>{p.booking}</td><td>{p.channel}</td><td>{p.boarded ? 'Yes' : 'No'}</td></tr>
            ))}
          </Table>
        </>
      )}
    </>
  );
}
