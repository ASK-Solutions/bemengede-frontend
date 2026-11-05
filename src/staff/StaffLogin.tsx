import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Field from '../components/Field';
import { api, fieldError } from '../lib/api';
import { useAuth } from '../lib/auth';

export default function StaffLogin() {
  const nav = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<unknown>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setErr(null);
    try {
      const r = await api<{ token: string; user: { role: string } & Record<string, never> }>('/auth/staff', { method: 'POST', body: { email, password } });
      signIn(r.token, r.user as never);
      nav(r.user.role === 'platform_admin' ? '/admin' : '/operator');
    } catch (x) { setErr(x); }
  };

  return (
    <div className="narrow stack" style={{ maxWidth: 480 }}>
      <h1 style={{ fontSize: 32 }}>Staff sign-in</h1>
      <p className="muted">For bus company staff and the Bemengede team. Travellers sign in with their phone on the <a href="/sign-in">traveller sign-in</a>.</p>
      <form className="card stack" onSubmit={submit} noValidate>
        <Field label="Work email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} error={fieldError(err, 'email')} required />
        <Field label="Password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button className="btn btn-primary">Sign in</button>
      </form>
      <p className="small muted">New staff: use the invitation link in your email to set a password.</p>
    </div>
  );
}
