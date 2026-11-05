import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import Field from '../components/Field';
import LoginMethods from '../components/LoginMethods';
import { api, ApiError, API_URL } from '../lib/api';
import { useAuth } from '../lib/auth';

export default function Account() {
  const { token, user, signOut, refresh } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [consents, setConsents] = useState<{ marketing_sms: boolean; marketing_email: boolean } | null>(null);
  const [deletion, setDeletion] = useState<{ scheduled: boolean; run_after: string | null } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!token) return;
    api<typeof consents>('/me/consents', { token }).then(setConsents);
    api<typeof deletion>('/me/deletion', { token }).then(setDeletion);
  }, [token]);
  useEffect(() => { setName(user?.name ?? ''); setEmail(user?.email ?? ''); }, [user]);

  if (!token) return <Navigate to="/sign-in?next=/account" replace />;

  const save = async () => {
    try { await api('/me', { method: 'PATCH', token, body: { name: name || null, email: email || null } }); refresh(); setMsg('Saved.'); }
    catch (e) { setMsg(e instanceof ApiError ? e.message : 'Could not save.'); }
  };
  const setMarketing = async (key: 'marketing_sms' | 'marketing_email', v: boolean) => {
    try { setConsents(await api('/me/consents', { method: 'PUT', token, body: { [key]: v } })); setMsg(v ? 'Subscribed.' : 'Unsubscribed. You won’t get offers on this channel.'); }
    catch (e) { setMsg(e instanceof ApiError ? e.message : 'Could not update.'); }
  };
  const download = async () => {
    const res = await fetch(`${API_URL}/me/export`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
    const url = URL.createObjectURL(await res.blob());
    const a = Object.assign(document.createElement('a'), { href: url, download: 'bemengede-my-data.json' });
    a.click(); URL.revokeObjectURL(url);
  };
  const del = async () => {
    try {
      const r = await api<{ message: string; run_after: string }>('/me', { method: 'DELETE', token });
      setDeletion({ scheduled: true, run_after: r.run_after }); setMsg(r.message); setConfirmDelete(false);
    } catch (e) { setMsg(e instanceof ApiError ? Object.values(e.errors)[0]?.[0] ?? e.message : 'Could not delete.'); }
  };
  const undoDelete = async () => { await api('/me/deletion/cancel', { method: 'POST', token }); setDeletion({ scheduled: false, run_after: null }); setMsg('Deletion cancelled.'); };

  return (
    <div className="narrow stack">
      <h1 style={{ fontSize: 34 }}>Account</h1>
      {msg && <p className="alert" role="status">{msg}</p>}

      <section className="card stack" aria-labelledby="profile">
        <h2 id="profile" style={{ fontSize: 20 }}>Your details</h2>
        <p className="muted small">Signed in as {user?.username ? `@${user.username}` : user?.phone ?? user?.email}</p>
        <Field label="Name (optional)" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
        <Field label="Email (optional)" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <div className="row"><button className="btn btn-primary" onClick={save}>Save</button><button className="btn btn-ghost" onClick={signOut}>Sign out</button></div>
      </section>

      <LoginMethods />

      <section className="card stack" aria-labelledby="mkt">
        <h2 id="mkt" style={{ fontSize: 20 }}>Messages</h2>
        <p className="small muted">Tickets and trip changes are always sent. Offers are only sent if you switch them on.</p>
        <label className="check"><input type="checkbox" checked={!!consents?.marketing_sms} disabled={!user?.login_methods?.phone} onChange={(e) => setMarketing('marketing_sms', e.target.checked)} /><span>Offers by SMS{!user?.login_methods?.phone && ' (add a phone first)'}</span></label>
        <label className="check"><input type="checkbox" checked={!!consents?.marketing_email} disabled={!user?.email} onChange={(e) => setMarketing('marketing_email', e.target.checked)} /><span>Offers by email{!user?.email && ' (add an email first)'}</span></label>
      </section>

      <section className="card stack" aria-labelledby="privacy">
        <h2 id="privacy" style={{ fontSize: 20 }}>Your data</h2>
        <p className="small muted">See what we keep and why in the <Link to="/privacy">Privacy Policy</Link>.</p>
        <button className="btn btn-ghost" onClick={download}>Download my data (JSON)</button>

        {deletion?.scheduled ? (
          <div className="alert stack" style={{ gap: 8 }}>
            <span>Your account will be deleted on {new Date(deletion.run_after!).toLocaleString('en-GB', { timeZone: 'Africa/Addis_Ababa' })}.</span>
            <button className="btn btn-ghost" onClick={undoDelete}>Keep my account</button>
          </div>
        ) : !confirmDelete ? (
          <button className="btn btn-danger" onClick={() => setConfirmDelete(true)}>Delete my account</button>
        ) : (
          <div className="stack" role="group" aria-labelledby="del-title">
            <p id="del-title"><strong>Delete your account and personal data?</strong> Your name, phone, email and passenger names are removed after a short waiting period, during which you can change your mind. Payment amounts are kept without your details, because the law requires it.</p>
            <div className="row">
              <button className="btn btn-danger" onClick={del}>Yes, delete my account</button>
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(false)}>Cancel</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
