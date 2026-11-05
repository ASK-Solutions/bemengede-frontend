import { useEffect, useState } from 'react';
import Field from '../../components/Field';
import { API_URL, ApiError } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { Msg, PageHead, Pill, Select, Table, useCall, useLoad } from '../ui';

type S = Record<string, string | number | null> & {
  accounts: { id: number; bank: string; account_name: string; account_number: string }[];
  documents: { id: number; type: string; status: string; note: string | null }[];
  checklist: { key: string; label: string; done: boolean }[];
  widget_snippet: string; commission_percent: number; status: string;
};
const BANKS: [string, string][] = [['CBE', 'Commercial Bank of Ethiopia'], ['CBE_BIRR', 'CBE Birr'], ['TELEBIRR', 'telebirr'], ['AWASH', 'Awash Bank'], ['DASHEN', 'Dashen Bank'], ['BOA', 'Bank of Abyssinia'], ['SIINQEE', 'Siinqee Bank'], ['MPESA', 'M-Pesa']];

export default function Settings() {
  const { token, user } = useAuth();
  const [s, reload] = useLoad<S>('/operator/settings');
  const call = useCall();
  const [f, setF] = useState<Record<string, string>>({});
  const [acc, setAcc] = useState({ bank: 'CBE', account_name: '', account_number: '' });
  const [docType, setDocType] = useState('trade_license');
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState<[string, 'ok' | 'error']>(['', 'ok']);
  const owner = user?.role === 'operator_owner';

  useEffect(() => {
    if (!s) return;
    const keys = ['legal_name', 'tin', 'trade_license_no', 'operating_license_no', 'contact_email', 'contact_phone', 'address', 'brand_color', 'logo_alt', 'free_cancel_hours', 'late_cancel_fee_percent'];
    setF(Object.fromEntries(keys.map((k) => [k, s[k] == null ? '' : String(s[k])])));
  }, [s]);
  const err = (e: unknown) => setMsg([e instanceof ApiError ? (Object.values(e.errors)[0]?.[0] ?? e.message) : 'Failed', 'error']);
  const save = async () => {
    try { await call('/operator/settings', 'PATCH', { ...f, free_cancel_hours: +f.free_cancel_hours, late_cancel_fee_percent: +f.late_cancel_fee_percent, brand_color: f.brand_color || null }); setMsg(['Saved. Policy changes apply to new bookings only.', 'ok']); reload(); }
    catch (e) { err(e); }
  };
  const addAccount = async () => { try { await call('/operator/accounts', 'POST', acc); setAcc({ ...acc, account_name: '', account_number: '' }); reload(); } catch (e) { err(e); } };
  const upload = async () => {
    if (!file) return;
    const body = new FormData(); body.append('type', docType); body.append('file', file);
    const res = await fetch(`${API_URL}/operator/documents`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }, body });
    if (res.ok) { setMsg(['Document uploaded. The Bemengede team will review it.', 'ok']); setFile(null); reload(); } else setMsg([(await res.json()).message ?? 'Upload failed', 'error']);
  };
  const field = (k: string, label: string, type = 'text', hint?: string) => <Field label={label} hint={hint} type={type} value={f[k] ?? ''} disabled={!owner} onChange={(e) => setF({ ...f, [k]: e.target.value })} />;

  if (!s) return <p>Loading…</p>;
  return (
    <>
      <PageHead title="Company settings" sub={`Status: ${s.status} · Commission ${s.commission_percent}%`} />
      <Msg text={msg[0]} kind={msg[1]} />
      <div className="split">
        <div className="main-col stack">
          <section className="card stack" aria-labelledby="co">
            <h2 id="co" style={{ fontSize: 18 }}>Company details</h2>
            {field('legal_name', 'Registered name')}
            <div className="row">{field('tin', 'TIN')}{field('trade_license_no', 'Trade licence no.')}{field('operating_license_no', 'Operating licence no.')}</div>
            <div className="row">{field('contact_phone', 'Public phone', 'tel')}{field('contact_email', 'Public email', 'email')}</div>
            {field('address', 'Head office address')}
          </section>
          <section className="card stack" aria-labelledby="pol">
            <h2 id="pol" style={{ fontSize: 18 }}>Cancellation policy</h2>
            <p className="small muted">Shown to travellers before they pay and on their ticket. Changes apply to new bookings only.</p>
            <div className="row">{field('free_cancel_hours', 'Free cancellation until (hours before departure)', 'number')}{field('late_cancel_fee_percent', 'Late cancellation fee (% of fare)', 'number', 'Maximum 50%')}</div>
          </section>
          <section className="card stack" aria-labelledby="brand">
            <h2 id="brand" style={{ fontSize: 18 }}>Branding</h2>
            <div className="row">{field('brand_color', 'Brand colour (#RRGGBB)')}{field('logo_alt', 'Logo description for screen readers', 'text', 'e.g. "Selam Bus logo"')}</div>
            <p className="small muted">Logos are added by the Bemengede team once we have your written permission to show them.</p>
            {owner && <button className="btn btn-primary" onClick={save}>Save settings</button>}
          </section>
          <section className="card stack" aria-labelledby="w">
            <h2 id="w" style={{ fontSize: 18 }}>Booking widget for your website</h2>
            <textarea readOnly value={s.widget_snippet} rows={3} aria-label="Widget embed code" style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, padding: 10, borderRadius: 10, border: '1px solid var(--border)' }} />
          </section>
        </div>
        <div className="side-col stack">
          <section className="card stack" aria-labelledby="ob">
            <h2 id="ob" style={{ fontSize: 18 }}>Onboarding</h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }} className="stack">
              {s.checklist.map((c) => <li key={c.key} className="check"><span className={`pill-s ${c.done ? 'ok' : 'neutral'}`}>{c.done ? 'Done' : 'To do'}</span>{c.label}</li>)}
            </ul>
          </section>
          <section className="card stack" aria-labelledby="acc">
            <h2 id="acc" style={{ fontSize: 18 }}>Receiving accounts</h2>
            <p className="small muted">Shown to travellers who pay by transfer. verify.et checks that money arrived in one of these.</p>
            <Table caption="Receiving accounts" head={['Bank', 'Name', 'Number', '']} empty={!s.accounts.length}>
              {s.accounts.map((a) => <tr key={a.id}><td>{a.bank}</td><td>{a.account_name}</td><td>{a.account_number}</td><td>{owner && <button className="linklike" onClick={() => call(`/operator/accounts/${a.id}`, 'DELETE').then(reload)}>Remove</button>}</td></tr>)}
            </Table>
            {owner && <>
              <Select label="Bank or wallet" value={acc.bank} onChange={(v) => setAcc({ ...acc, bank: v })} options={BANKS} />
              <Field label="Account name" value={acc.account_name} onChange={(e) => setAcc({ ...acc, account_name: e.target.value })} />
              <Field label="Account number" inputMode="numeric" value={acc.account_number} onChange={(e) => setAcc({ ...acc, account_number: e.target.value })} />
              <button className="btn btn-ghost" onClick={addAccount}>Add account</button>
            </>}
          </section>
          <section className="card stack" aria-labelledby="docs">
            <h2 id="docs" style={{ fontSize: 18 }}>Licence documents</h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }} className="stack">
              {s.documents.map((d) => <li key={d.id} className="row between"><span>{d.type.replace('_', ' ')}</span><Pill status={d.status} /></li>)}
            </ul>
            {owner && <>
              <Select label="Document type" value={docType} onChange={setDocType} options={[['trade_license', 'Trade licence'], ['tin', 'TIN certificate'], ['operating_license', 'Operating licence'], ['other', 'Other']]} />
              <div className="field"><label htmlFor="doc-file">File (PDF, JPG or PNG, up to 5 MB)</label><input id="doc-file" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div>
              <button className="btn btn-ghost" disabled={!file} onClick={upload}>Upload</button>
            </>}
          </section>
        </div>
      </div>
    </>
  );
}
