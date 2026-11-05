import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from './api';

type User = { id: number; name: string | null; phone: string; email: string | null; locale: string; role: string; operator_id?: number | null };
type Ctx = { token: string | null; user: User | null; signIn: (token: string, user: User) => void; signOut: () => void; refresh: () => void };

const AuthCtx = createContext<Ctx>(null!);
const KEY = 'bm_session'; // session storage: cleared when the tab closes (strictly necessary)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem(KEY));
  const [user, setUser] = useState<User | null>(null);

  const refresh = () => {
    if (!token) return setUser(null);
    api<User>('/me', { token }).then(setUser).catch(() => { sessionStorage.removeItem(KEY); setToken(null); });
  };
  useEffect(refresh, [token]);

  return (
    <AuthCtx.Provider
      value={{
        token,
        user,
        refresh,
        signIn: (t, u) => { sessionStorage.setItem(KEY, t); setToken(t); setUser(u); },
        signOut: () => {
          if (token) api('/auth/logout', { method: 'POST', token }).catch(() => {});
          sessionStorage.removeItem(KEY); setToken(null); setUser(null);
        },
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
