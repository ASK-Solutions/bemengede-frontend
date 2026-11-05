import { useState } from 'react';
import Field from './Field';
import GoogleButton from './GoogleButton';
import { api, ApiError, fieldError } from '../lib/api';
import { useAuth } from '../lib/auth';

type Methods = { phone: boolean; password: boolean; google: boolean };

/** Account › Sign-in methods: add a phone, set a username/password, link or unlink Google. */
export default function LoginMethods() {
  const { token, user, refresh } = useAuth();
  const m: Methods = user?.login_methods ?? { phone: false, password: false, google: false };
  const [open, setOpen] = useState<'phone' | 'password' | null>(null);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [pw, setPw] = useState({ username: '', current_password: '', password: '', password_confirmation: '' });
  const [err, setErr] = useState<unknown>(null);
  const [msg, setMsg] = useState('');

  const call = async (path: string, method: string, body?: unknown, ok?: string) => {
    setErr(null); setMsg('');
    try { await api(path, { method, body, token }); refresh(); if (ok) setMsg(ok); return true; } catch (x) { setErr(x); return false; }
  };
  const generic = err instanceof ApiError && !Object.keys(err.errors).length ? err.message : '';

  return (
    <section className="card stack" aria-labelledby="methods">
      <h2 id="methods" style={{ fontSize: 20 }}>Sign-in methods</h2>
      {msg && <p className="alert alert-ok" role="status">{msg}</p>}
      {generic && <p className="alert alert-error" role="alert">{generic}</p>}

      <div className="row between">
        <span><strong>Phone</strong><br /><span className="small muted">{m.phone ? user?.phone : 'Not added'}</span></span>
        <button className="btn btn-ghost" onClick={() => { setOpen(open === 'phone' ? null : 'phone'); setCodeSent(false); }}>{m.phone ? 'Change' : 'Add phone'}</button>
      </div>
      {open === 'phone' && (
        <div className="stack" style={{ paddingLeft: 12, borderLeft: '3px solid var(--line)' }}>
          {!codeSent ? <>
            <Field label="Mobile number" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} error={fieldError(err, 'phone')} />
            <button className="btn btn-primary" onClick={async () => { if (await call('/me/phone/code', 'POST', { phone })) setCodeSent(true); }}>Send code</button>
          </> : <>
            <Field label="6-digit code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} error={fieldError(err, 'code')} />
            <button className="btn btn-primary" onClick={async () => { if (await call('/me/phone', 'POST', { phone, code }, 'Phone verified. Bookings made with this number now appear in My trips.')) setOpen(null); }}>Verify</button>
          </>}
        </div>
      )}

      <div className="row between">
        <span><strong>Username &amp; password</strong><br /><span className="small muted">{m.password ? (user?.username ? `@${user.username}` : 'Password set') : 'Not set'}</span></span>
        <button className="btn btn-ghost" onClick={() => setOpen(open === 'password' ? null : 'password')}>{m.password ? 'Change password' : 'Set up'}</button>
      </div>
      {open === 'password' && (
        <div className="stack" style={{ paddingLeft: 12, borderLeft: '3px solid var(--line)' }}>
          {!user?.username && <Field label="Choose a username" autoComplete="username" autoCapitalize="none" value={pw.username} onChange={(e) => setPw({ ...pw, username: e.target.value.toLowerCase() })} error={fieldError(err, 'username')} />}
          {m.password && <Field label="Current password" type="password" autoComplete="current-password" value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} error={fieldError(err, 'current_password')} />}
          <Field label="New password" hint="At least 10 characters, with letters and numbers" type="password" autoComplete="new-password" value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} error={fieldError(err, 'password')} />
          <Field label="Repeat new password" type="password" autoComplete="new-password" value={pw.password_confirmation} onChange={(e) => setPw({ ...pw, password_confirmation: e.target.value })} />
          <button className="btn btn-primary" onClick={async () => { if (await call('/me/password', 'PUT', { ...pw, username: pw.username || null }, 'Password saved. Other devices were signed out.')) { setOpen(null); setPw({ username: '', current_password: '', password: '', password_confirmation: '' }); } }}>Save</button>
        </div>
      )}

      <div className="row between">
        <span><strong>Google</strong><br /><span className="small muted">{m.google ? 'Linked' : 'Not linked'}</span></span>
        {m.google
          ? <button className="btn btn-ghost" onClick={() => call('/me/google', 'DELETE', undefined, 'Google unlinked.')}>Unlink</button>
          : <div style={{ minWidth: 220 }}><GoogleButton label="Link Google" onToken={(t) => call('/me/google', 'POST', { access_token: t }, 'Google linked.')} onError={(e) => setMsg(e)} /></div>}
      </div>
    </section>
  );
}
