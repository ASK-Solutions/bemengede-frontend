import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';

/** One click from the message, no sign-in, no "are you sure?" maze. */
export default function Unsubscribe() {
  const { token = '' } = useParams();
  const [state, setState] = useState<'working' | 'done' | 'error'>('working');
  const [channel, setChannel] = useState('');

  useEffect(() => {
    api<{ channel: string }>(`/unsubscribe/${token}`, { method: 'POST' })
      .then((r) => { setChannel(r.channel === 'sms' ? 'SMS' : 'email'); setState('done'); })
      .catch(() => setState('error'));
  }, [token]);

  return (
    <div className="narrow stack" aria-live="polite">
      {state === 'working' && <h1 style={{ fontSize: 32 }}>Unsubscribing…</h1>}
      {state === 'done' && <><h1 style={{ fontSize: 32 }}>You’re unsubscribed</h1><p>You won’t get any more offers by {channel}. Tickets and trip updates will still arrive.</p></>}
      {state === 'error' && <><h1 style={{ fontSize: 32 }}>This link didn’t work</h1><p>Turn off offers in your <Link to="/account">account</Link>, or email us and we’ll do it for you.</p></>}
    </div>
  );
}
