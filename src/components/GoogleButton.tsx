import { useState } from 'react';
import { googleAccessToken } from '../lib/google';

/** Our own button (so Google's script isn't loaded until it's clicked). */
export default function GoogleButton({ label = 'Continue with Google', onToken, onError }: { label?: string; onToken: (t: string) => void; onError: (m: string) => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <button type="button" className="btn btn-ghost btn-block" disabled={busy} onClick={async () => {
      setBusy(true);
      try { onToken(await googleAccessToken()); } catch (e) { onError(e instanceof Error ? e.message : 'Google sign-in failed.'); }
      setBusy(false);
    }}>
      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.8 6C12.4 13.7 17.7 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
        <path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.9-6z" />
        <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.2-13.5-9.9l-7.9 6C6.5 42.6 14.6 48 24 48z" />
      </svg>
      {busy ? 'Waiting for Google…' : label}
    </button>
  );
}
