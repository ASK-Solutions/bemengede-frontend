import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Field from '../components/Field';
import { api, fieldError } from '../lib/api';
import { useAuth } from '../lib/auth';

export default function AcceptInvite() {
  const { token = '' } = useParams();
  const nav = useNavigate();
  const { signIn } = useAuth();
  const [inv, setInv] = useState<{ name: string; email: string; role: string; operator: string | null } | null>(null);
  const [bad, setBad] = useState(false);
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [adult, setAdult] = useState(false);
  const [err, setErr] = useState<unknown>(null);

  useEffect(() => { api<typeof inv>(`/auth/invitations/${token}`).then(setInv).catch(() => setBad(true)); }, [token]);

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setErr(null);
    try {
      const r = await api<{ token: string; user: { role: string } }>(`/auth/invitations/${token}`, { method: 'POST', body: { password: pw, password_confirmation: pw2, confirm_adult: adult } });
      signIn(r.token, r.user as never);
      nav(r.user.role === 'platform_admin' ? '/admin' : '/operator');
    } catch (x) { setErr(x); }
  };

  if (bad) return <div className="narrow"><h1 style={{ fontSize: 30 }}>This invitation has expired or was already used</h1><p>Ask whoever invited you to send a new one.</p></div>;
  if (!inv) return <div className="narrow"><p>Loading…</p></div>;
  return (
    <div className="narrow stack" style={{ maxWidth: 520 }}>
      <h1 style={{ fontSize: 30 }}>Welcome, {inv.name}</h1>
      <p className="muted">You're joining {inv.operator ?? 'the Bemengede team'} as {inv.role.replace('operator_', '').replace('_', ' ')}. Your sign-in email is {inv.email}.</p>
      <form className="card stack" onSubmit={submit} noValidate>
        <Field label="Choose a password" hint="At least 10 characters" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} error={fieldError(err, 'password')} required />
        <Field label="Repeat the password" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} required />
        <label className="check"><input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} /><span>I am 18 or older.</span></label>
        {fieldError(err, 'confirm_adult') && <span className="error" role="alert">{fieldError(err, 'confirm_adult')}</span>}
        <button className="btn btn-primary">Set password and continue</button>
      </form>
    </div>
  );
}
