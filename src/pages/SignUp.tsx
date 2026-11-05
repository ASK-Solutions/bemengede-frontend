import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import ConsentBoxes from '../components/ConsentBoxes';
import Field from '../components/Field';
import GoogleButton from '../components/GoogleButton';
import { api, ApiError, fieldError } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useGoogleSignIn } from '../lib/useGoogleSignIn';

export default function SignUp() {
  const [q] = useSearchParams();
  const next = q.get('next')?.startsWith('/') ? q.get('next')! : '/account';
  const nav = useNavigate();
  const { signIn } = useAuth();
  const google = useGoogleSignIn(() => nav(next));
  // Only the fields an account needs; name and email are optional.
  const [f, setF] = useState({ username: '', password: '', password_confirmation: '', name: '', email: '' });
  const [adult, setAdult] = useState(false);
  const [terms, setTerms] = useState(false);
  const [err, setErr] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr(null);
    try {
      const r = await api<{ token: string; user: never }>('/auth/register', { method: 'POST', body: { ...f, username: f.username.trim().toLowerCase(), email: f.email || null, name: f.name || null, accept_terms: terms, confirm_adult: adult, device_name: 'web' } });
      signIn(r.token, r.user); nav(next);
    } catch (x) { setErr(x); setBusy(false); (document.querySelector('[aria-invalid="true"]') as HTMLElement | null)?.focus(); }
  };

  if (google.pending) {
    return (
      <div className="narrow stack" style={{ maxWidth: 520 }}>
        <h1 style={{ fontSize: 32 }}>Almost done</h1>
        <div className="card stack">
          <ConsentBoxes adult={adult} terms={terms} setAdult={setAdult} setTerms={setTerms} />
          {google.error && <p className="error" role="alert">{google.error}</p>}
          <button className="btn btn-primary" disabled={!adult || !terms} onClick={() => google.finish(adult, terms)}>Create account with Google</button>
          <button className="linklike" onClick={google.cancel}>Cancel</button>
        </div>
      </div>
    );
  }

  const set = (k: keyof typeof f) => (e: ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <div className="narrow stack" style={{ maxWidth: 520 }}>
      <h1 style={{ fontSize: 34 }}>Create an account</h1>
      <p className="muted">An account keeps all your trips in one place. You can also book without one. Already registered? <Link to={`/sign-in?next=${encodeURIComponent(next)}`}>Sign in</Link></p>

      <div className="card stack">
        <GoogleButton label="Sign up with Google" onToken={google.start} onError={google.setError} />
        {google.error && <p className="error" role="alert">{google.error}</p>}
        <Link className="btn btn-ghost btn-block" to={`/sign-in?next=${encodeURIComponent(next)}`}>Sign up with your phone number</Link>
        <div className="row" aria-hidden="true" style={{ gap: 10 }}><hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--line)' }} /><span className="small muted">or choose a username</span><hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--line)' }} /></div>

        <form className="stack" onSubmit={submit} noValidate>
          <Field label="Username" hint="3–30 lowercase letters, numbers, dots or underscores" autoComplete="username" autoCapitalize="none" value={f.username} onChange={set('username')} error={fieldError(err, 'username')} required />
          <Field label="Password" hint="At least 10 characters, with letters and numbers" type="password" autoComplete="new-password" value={f.password} onChange={set('password')} error={fieldError(err, 'password')} required />
          <Field label="Repeat password" type="password" autoComplete="new-password" value={f.password_confirmation} onChange={set('password_confirmation')} required />
          <Field label="Name (optional)" autoComplete="name" value={f.name} onChange={set('name')} />
          <Field label="Email (optional)" hint="Lets you reset your password if you forget it" type="email" autoComplete="email" value={f.email} onChange={set('email')} error={fieldError(err, 'email')} />
          <ConsentBoxes adult={adult} terms={terms} setAdult={setAdult} setTerms={setTerms} errors={{ adult: fieldError(err, 'confirm_adult'), terms: fieldError(err, 'accept_terms') }} />
          {err instanceof ApiError && !Object.keys(err.errors).length && <p className="error" role="alert">{err.message}</p>}
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
          <p className="small muted">Without an email or phone on your account we can’t help you reset a forgotten password. You can add a phone later in your account.</p>
        </form>
      </div>
    </div>
  );
}
