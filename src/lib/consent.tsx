import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from './api';

/**
 * Cookie consent. Only strictly-necessary storage is used until the visitor chooses.
 * "Reject" and "Allow" have equal weight; nothing optional loads before a "yes".
 * Bump CONSENT_VERSION when the cookie policy changes to ask again.
 */
export const CONSENT_VERSION = '2026-11-04';
const KEY = 'bm_consent';

type Choice = { analytics: boolean; version: string; id: string; at: string };
type Ctx = {
  choice: Choice | null;
  settingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  decide: (analytics: boolean) => void;
};

const ConsentCtx = createContext<Ctx>(null!);

function read(): Choice | null {
  try {
    const c = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Choice | null;
    return c && c.version === CONSENT_VERSION ? c : null;
  } catch {
    return null;
  }
}

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [choice, setChoice] = useState<Choice | null>(() => read());
  const [settingsOpen, setSettingsOpen] = useState(false);

  const decide = useCallback((analytics: boolean) => {
    const c: Choice = { analytics, version: CONSENT_VERSION, id: choice?.id ?? crypto.randomUUID(), at: new Date().toISOString() };
    try { localStorage.setItem(KEY, JSON.stringify(c)); } catch { /* private mode: choice lasts this visit */ }
    setChoice(c);
    setSettingsOpen(false);
    api('/consents/cookies', { method: 'POST', body: { anonymous_id: c.id, analytics } }).catch(() => {});
  }, [choice]);

  useEffect(() => {
    if (choice?.analytics) loadAnalytics();
  }, [choice]);

  return (
    <ConsentCtx.Provider value={{ choice, settingsOpen, openSettings: () => setSettingsOpen(true), closeSettings: () => setSettingsOpen(false), decide }}>
      {children}
    </ConsentCtx.Provider>
  );
}

export const useConsent = () => useContext(ConsentCtx);

/**
 * No analytics SDK ships at launch. If you add one, load it ONLY here, list it in
 * docs/THIRD_PARTY_SDKS.md and the Cookie Policy, and bump CONSENT_VERSION.
 */
function loadAnalytics() {
  /* intentionally empty */
}
