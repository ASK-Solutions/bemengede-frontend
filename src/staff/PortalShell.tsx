import { Navigate, NavLink, Outlet } from 'react-router-dom';
import Logo from '../components/Logo';
import CookieConsent from '../components/CookieConsent';
import { useAuth } from '../lib/auth';

type Item = [to: string, label: string, badge?: number];

export default function PortalShell({ area, items, roles }: { area: string; items: Item[]; roles: string[] }) {
  const { token, user, signOut } = useAuth();
  if (!token) return <Navigate to="/staff/login" replace />;
  if (!user) return <p className="narrow">Loading…</p>;
  if (!roles.includes(user.role)) return <div className="narrow"><h1 style={{ fontSize: 28 }}>No access</h1><p>Your account can’t open the {area}.</p></div>;

  return (
    <div className="portal">
      <a className="skip" href="#portal-main">Skip to main content</a>
      <aside className="portal-side">
        <div className="row" style={{ gap: 8 }}><Logo size={30} /><strong style={{ fontFamily: 'var(--display)', fontSize: 18 }}>Bemengede</strong><span className="small" style={{ color: '#C6D1CC' }}>{area}</span></div>
        <nav aria-label={area}>
          {items.map(([to, label, badge]) => (
            <NavLink key={to} to={to} end={to.split('/').length === 2}>
              <span>{label}</span>
              {!!badge && <span className="pill-s warn" aria-label={`${badge} waiting`}>{badge}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="stack" style={{ marginTop: 'auto', gap: 8 }}>
          <span className="small" style={{ color: '#C6D1CC' }}>{user.name ?? user.email}<br />{user.role.replace(/_/g, ' ')}</span>
          <button className="btn btn-ghost" onClick={signOut}>Sign out</button>
        </div>
      </aside>
      <main id="portal-main" className="portal-main"><Outlet /></main>
      <CookieConsent />
    </div>
  );
}
