import { useState } from 'react';
import { api, ApiError } from './api';
import { useAuth } from './auth';

/**
 * Google sign-in / sign-up. If the Google account is new, the server answers
 * "needs consent"; we then show the 18+ and terms boxes and send the same token again.
 */
export function useGoogleSignIn(onDone: () => void) {
  const { signIn } = useAuth();
  const [pending, setPending] = useState<string | null>(null); // access token waiting for consent
  const [error, setError] = useState('');

  const submit = async (accessToken: string, consent?: { confirm_adult: boolean; accept_terms: boolean }) => {
    setError('');
    try {
      const r = await api<{ token: string; user: never }>('/auth/google', { method: 'POST', body: { access_token: accessToken, device_name: 'web', ...consent } });
      signIn(r.token, r.user);
      setPending(null);
      onDone();
    } catch (e) {
      if (e instanceof ApiError && e.status === 422 && (e.errors.confirm_adult || e.errors.accept_terms) && !consent) {
        setPending(accessToken);
      } else {
        setError(e instanceof ApiError ? (Object.values(e.errors)[0]?.[0] ?? e.message) : 'Google sign-in failed.');
      }
    }
  };

  return { pending, error, setError, start: (t: string) => submit(t), finish: (adult: boolean, terms: boolean) => pending && submit(pending, { confirm_adult: adult, accept_terms: terms }), cancel: () => setPending(null) };
}
