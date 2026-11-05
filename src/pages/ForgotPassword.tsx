import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Field from '../components/Field';
import { api, fieldError } from '../lib/api';
import { useAuth } from '../lib/auth';

export default function ForgotPassword() {
  const nav = useNavigate();
  const { signIn } = useAuth();
  const [login, setLogin] = useState('');
  const [sent, setSent] = useState('');
  const [code, setCode] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [err, setErr] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  const send = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr(null);
    try { setSent((await api<{ message: string }>('/auth/password/forgot', { method: 'POST', body: { login } })).message); } catch (x) { setErr(x); }
    setBusy(false);
  };
  const reset = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr(null);
    try {
      const r = await api<{ token: string; user: never }>('/auth/password/reset', { method: 'POST', body: { login, code, password: pw, password_confirmation: pw2 } });
      signIn(r.token, r.user); nav('/account');
    } catch (x) { setErr(x); setBusy(false); }
  };

  return (
    <div className="narrow stack" style={{ maxWidth: 520 }}>
      <h1 style={{ fontSize: 32 }}>Reset your password</h1>
      {!sent ? (
        <form className="card stack" onSubmit={send} noValidate>
          <Field label="Username, email or phone" autoComplete="username" autoCapitalize="none" value={login} onChange={(e) => setLogin(e.target.value)} error={fieldError(err, 'login')} required />
          <button className="btn btn-primary" disabled={busy || !login}>Send a code</button>
        </form>
      ) : (
        <form className="card stack" onSubmit={reset} noValidate>
          <p className="alert alert-ok" role="status">{sent}</p>
          <Field label="6-digit code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} error={fieldError(err, 'code')} required />
          <Field label="New password" hint="At least 10 characters, with letters and numbers" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} error={fieldError(err, 'password')} required />
          <Field label="Repeat new password" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} required />
          <button className="btn btn-primary" disabled={busy || code.length !== 6}>Set new password</button>
          <p className="small muted">You’ll be signed out on your other devices.</p>
        </form>
      )}
    </div>
  );
}
