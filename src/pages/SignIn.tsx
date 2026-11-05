import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Field from '../components/Field';
import { api, fieldError } from '../lib/api';
import { useAuth } from '../lib/auth';

export default function SignIn() {
  const [q] = useSearchParams();
  const next = q.get('next')?.startsWith('/') ? q.get('next')! : '/my-trips';
  const nav = useNavigate();
  const { signIn } = useAuth();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [stage, setStage] = useState<'phone' | 'code'>('phone');
  const [isNew, setIsNew] = useState(false);
  const [adult, setAdult] = useState(false);
  const [err, setErr] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  const send = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr(null);
    try {
      const r = await api<{ new_account: boolean }>('/auth/otp', { method: 'POST', body: { phone } });
      setIsNew(r.new_account); setStage('code');
    } catch (x) { setErr(x); }
    setBusy(false);
  };

  const verify = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr(null);
    try {
      const r = await api<{ token: string; user: never }>('/auth/verify', { method: 'POST', body: { phone, code, confirm_adult: adult, device_name: 'web' } });
      signIn(r.token, r.user);
      nav(next);
    } catch (x) { setErr(x); setBusy(false); }
  };

  return (
    <div className="narrow stack" style={{ maxWidth: 520 }}>
      <h1 style={{ fontSize: 34 }}>Sign in</h1>
      <p className="muted">No password. We text you a 6-digit code.</p>
      {stage === 'phone' ? (
        <form className="card stack" onSubmit={send} noValidate>
          <Field label="Mobile number" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} error={fieldError(err, 'phone')} required />
          <button className="btn btn-primary" disabled={busy}>Send code</button>
        </form>
      ) : (
        <form className="card stack" onSubmit={verify} noValidate>
          <Field label="6-digit code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} error={fieldError(err, 'code')} required />
          {isNew && (
            <>
              <label className="check">
                <input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} aria-invalid={!!fieldError(err, 'confirm_adult')} />
                <span>I am 18 or older. (If you are under 18, please ask a parent or guardian to book for you.)</span>
              </label>
              {fieldError(err, 'confirm_adult') && <span className="error" role="alert">{fieldError(err, 'confirm_adult')}</span>}
              <p className="small muted">Creating an account means you accept the <Link to="/terms">Terms</Link>. See how we use your number in the <Link to="/privacy">Privacy Policy</Link>.</p>
            </>
          )}
          <button className="btn btn-primary" disabled={busy || code.length !== 6}>Sign in</button>
          <button type="button" className="linklike" onClick={() => setStage('phone')}>Use a different number</button>
        </form>
      )}
    </div>
  );
}
