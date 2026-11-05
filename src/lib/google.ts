/**
 * Google sign-in for the website (Google Identity Services, token popup).
 * Google's script is loaded ONLY when someone clicks "Continue with Google",
 * so no Google code runs or sets cookies before that choice.
 */
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

type TokenResponse = { access_token?: string; error?: string };
type GoogleNS = { accounts: { oauth2: { initTokenClient: (o: { client_id: string; scope: string; callback: (r: TokenResponse) => void; error_callback?: (e: { type: string }) => void }) => { requestAccessToken: (o?: { prompt?: string }) => void } } } };

let loading: Promise<GoogleNS> | null = null;
function load(): Promise<GoogleNS> {
  const w = window as unknown as { google?: GoogleNS };
  if (w.google?.accounts) return Promise.resolve(w.google);
  loading ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => resolve((window as unknown as { google: GoogleNS }).google);
    s.onerror = () => { loading = null; reject(new Error('Could not reach Google. Check your connection.')); };
    document.head.appendChild(s);
  });
  return loading;
}

/** Opens Google's popup and resolves with an access token our server then verifies. */
export async function googleAccessToken(): Promise<string> {
  if (!GOOGLE_CLIENT_ID) throw new Error('Google sign-in is not set up yet (VITE_GOOGLE_CLIENT_ID is empty).');
  const g = await load();
  return new Promise((resolve, reject) => {
    const client = g.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'openid email profile',
      callback: (r) => (r.access_token ? resolve(r.access_token) : reject(new Error('Google sign-in was cancelled.'))),
      error_callback: () => reject(new Error('Google sign-in was cancelled.')),
    });
    client.requestAccessToken({ prompt: 'select_account' });
  });
}
