import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

/** Load JSON from the API with the staff token; returns [data, reload, error]. */
export function useLoad<T>(path: string | null): [T | null, () => void, string] {
  const { token } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [err, setErr] = useState('');
  const load = useCallback(() => {
    if (!path) return;
    api<T>(path, { token }).then((d) => { setData(d); setErr(''); }).catch((e) => setErr(e.message));
  }, [path, token]);
  useEffect(load, [load]);
  return [data, load, err];
}

/** Call the API with the staff token. */
export function useCall() {
  const { token } = useAuth();
  return <T,>(path: string, method = 'POST', body?: unknown) => api<T>(path, { method, body, token });
}

export function PageHead({ title, sub, actions }: { title: string; sub?: string; actions?: ReactNode }) {
  return (
    <header className="row between" style={{ alignItems: 'flex-end', marginBottom: 4 }}>
      <div><h1 style={{ fontSize: 30 }}>{title}</h1>{sub && <p className="muted">{sub}</p>}</div>
      {actions && <div className="row">{actions}</div>}
    </header>
  );
}

export function Kpis({ items }: { items: [string, ReactNode, string?][] }) {
  return (
    <div className="grid-kpi">
      {items.map(([l, v, s]) => (
        <div key={l} className="card"><div className="small muted" style={{ fontWeight: 600 }}>{l}</div><div className="kpi">{v}</div>{s && <div className="small muted">{s}</div>}</div>
      ))}
    </div>
  );
}

const PILL: Record<string, string> = {
  active: 'ok', confirmed: 'ok', checked_in: 'ok', approved: 'ok', auto_approved: 'ok', paid: 'ok', settled_by_provider: 'ok', resolved: 'ok', arrived: 'ok', succeeded: 'ok',
  scheduled: 'info', departed: 'info', boarding: 'info', invoiced: 'info', applied: 'info',
  needs_review: 'warn', under_review: 'warn', pending_payment: 'warn', awaiting_verification: 'warn', maintenance: 'warn', open: 'warn', invited: 'neutral', pending: 'warn', refund_due: 'warn',
  cancelled: 'bad', rejected: 'bad', suspended: 'bad', expired: 'neutral', retired: 'neutral', inactive: 'neutral', refunded: 'neutral',
};
export function Pill({ status, label }: { status: string; label?: string }) {
  return <span className={`pill-s ${PILL[status] ?? 'neutral'}`}>{label ?? status.replace(/_/g, ' ')}</span>;
}

export function Table({ caption, head, children, empty }: { caption: string; head: string[]; children: ReactNode; empty?: boolean }) {
  return (
    <div className="card" style={{ padding: 0 }}>
      <div className="table-wrap">
        <table className="data">
          <caption className="sr-only">{caption}</caption>
          <thead><tr>{head.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
          <tbody>{children}</tbody>
        </table>
      </div>
      {empty && <p className="muted" style={{ padding: 16 }}>Nothing here yet.</p>}
    </div>
  );
}

/** Accessible modal using the native <dialog> (focus trap + Esc built in). */
export function Modal({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (open) ref.current?.showModal(); else ref.current?.close(); }, [open]);
  return (
    <dialog ref={ref} onClose={onClose} aria-labelledby="modal-title" style={{ maxWidth: 640 }}>
      <div className="row between"><h2 id="modal-title" style={{ fontSize: 22 }}>{title}</h2><button className="btn btn-ghost" onClick={onClose} aria-label="Close">✕</button></div>
      <div className="stack" style={{ marginTop: 12 }}>{open && children}</div>
    </dialog>
  );
}

export function Select({ label, value, onChange, options, required }: { label: string; value: string | number; onChange: (v: string) => void; options: [string | number, string][]; required?: boolean }) {
  const id = `s-${label.replace(/\W/g, '')}`;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} required={required}>
        <option value="">Choose…</option>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}

export function Msg({ text, kind = 'ok' }: { text: string; kind?: 'ok' | 'error' }) {
  if (!text) return null;
  return <p className={`alert ${kind === 'ok' ? 'alert-ok' : 'alert-error'}`} role={kind === 'ok' ? 'status' : 'alert'}>{text}</p>;
}

export const dateTime = (iso: string) => new Date(iso).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Addis_Ababa' });
