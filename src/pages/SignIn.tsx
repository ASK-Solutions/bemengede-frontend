import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import ConsentBoxes from '../components/ConsentBoxes';
import Field from '../components/Field';
import GoogleButton from '../components/GoogleButton';
import { api, fieldError } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useGoogleSignIn } from '../lib/useGoogleSignIn';

type Mode = 'phone' | 'password';

export default function SignIn() {
  const [q] = useSearchParams();
  const next = q.get('next')?.startsWith('/') ? q.get('next')! : '/my-trips';
  const nav = useNavigate();
  const { signIn } = useAuth();
  const google = useGoogleSignIn(() => nav(next));
  const [mode, setMode] = useState<Mode>('phone');

  // Phone + code
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [stage, setStage] = useState<'phone' | 'code'>('phone');
  const [isNew, setIsNew] = useState(false);
  // Username + password
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  // Shared
  const [adult, setAdult] = useState(false);
  const [terms, setTerms] = useState(false);
  const [err, setErr] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>) => { setBusy(true); setErr(null); try { await fn(); } catch (x) { setErr(x); } setBusy(false); };
  const sendCode = (e: FormEvent) => { e.preventDefault(); run(async () => { const r = await api<{ new_account: boolean }>('/auth/otp', { method: 'POST', body: { phone } }); setIsNew(r.new_account); setStage('code'); }); };
  const verifyCode = (e: FormEvent) => { e.preventDefault(); run(async () => {
    const r = await api<{ token: string; user: never }>('/auth/verify', { method: 'POST', body: { phone, code, confirm_adult: adult, accept_terms: terms, device_name: 'web' } });
    signIn(r.token, r.user); nav(next);
  }); };
  const passwordLogin = (e: FormEvent) => { e.preventDefault(); run(async () => {
    const r = await api<{ token: string; user: never }>('/auth/login', { method: 'POST', body: { login, password, device_name: 'web' } });
    signIn(r.token, r.user); nav(next);
  }); };

  if (google.pending) {
    return (
      <div className="narrow stack" style={{ maxWidth: 520 }}>
        <h1 style={{ fontSize: 32 }}>Create your account</h1>
        <p className="muted">This Google account is new to Bemengede. Please confirm:</p>
        <div className="card stack">
          <ConsentBoxes adult={adult} terms={terms} setAdult={setAdult} setTerms={setTerms} />
          {google.error && <p className="error" role="alert">{google.error}</p>}
          <button className="btn btn-primary" disabled={!adult || !terms} onClick={() => google.finish(adult, terms)}>Create account</button>
          <button className="linklike" onClick={google.cancel}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="narrow stack" style={{ maxWidth: 520 }}>
      <h1 style={{ fontSize: 34 }}>Sign in</h1>
      <p className="muted">New here? <Link to={`/sign-up?next=${encodeURIComponent(next)}`}>Create an account</Link>, or just book: you don’t need an account.</p>

      <div className="card stack">
        <GoogleButton onToken={google.start} onError={google.setError} />
        {google.error && <p className="error" role="alert">{google.error}</p>}
        <div className="row" aria-hidden="true" style={{ gap: 10 }}><hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--line)' }} /><span className="small muted">or</span><hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--line)' }} /></div>

        <div className="tabs" role="group" aria-label="Sign in with">
          <button className="chip" aria-pressed={mode === 'phone'} onClick={() => { setMode('phone'); setErr(null); }}>Phone number</button>
          <button className="chip" aria-pressed={mode === 'password'} onClick={() => { setMode('password'); setErr(null); }}>Username &amp; password</button>
        </div>

        {mode === 'phone' && (stage === 'phone' ? (
          <form className="stack" onSubmit={sendCode} noValidate>
            <Field label="Mobile number" hint="We’ll text you a 6-digit code" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} error={fieldError(err, 'phone')} required />
            <button className="btn btn-primary" disabled={busy || phone.length < 9}>Send code</button>
          </form>
        ) : (
          <form className="stack" onSubmit={verifyCode} noValidate>
            <Field label="6-digit code" hint={`Sent to ${phone}`} inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} error={fieldError(err, 'code')} required />
            {isNew && <ConsentBoxes adult={adult} terms={terms} setAdult={setAdult} setTerms={setTerms} errors={{ adult: fieldError(err, 'confirm_adult'), terms: fieldError(err, 'accept_terms') }} />}
            <button className="btn btn-primary" disabled={busy || code.length !== 6}>{isNew ? 'Create account' : 'Sign in'}</button>
            <button type="button" className="linklike" onClick={() => setStage('phone')}>Use a different number</button>
          </form>
        ))}

        {mode === 'password' && (
          <form className="stack" onSubmit={passwordLogin} noValidate>
            <Field label="Username, email or phone" autoComplete="username" autoCapitalize="none" value={login} onChange={(e) => setLogin(e.target.value)} error={fieldError(err, 'login')} required />
            <Field label="Password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button className="btn btn-primary" disabled={busy || !login || !password}>Sign in</button>
            <Link to="/forgot-password" className="small">Forgot your password?</Link>
          </form>
        )}
      </div>
      <p className="small muted">Bus company staff: use the <Link to="/staff/login">staff sign-in</Link>.</p>
    </div>
  );
}
