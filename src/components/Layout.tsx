import { Link, NavLink, Outlet } from 'react-router-dom';
import Logo from './Logo';
import CookieConsent from './CookieConsent';
import { useConsent } from '../lib/consent';
import { useAuth } from '../lib/auth';
import { useBusiness } from '../lib/useBusiness';

export default function Layout() {
  const { openSettings } = useConsent();
  const { user } = useAuth();
  const b = useBusiness();

  return (
    <>
      <a className="skip" href="#main">Skip to main content</a>
      <header className="site-header">
        <div className="wrap">
          <Link to="/" className="brand"><Logo />Bemengede</Link>
          <nav className="nav" aria-label="Main">
            <NavLink to="/" end>Book a trip</NavLink>
            <NavLink to="/my-trips">My trips</NavLink>
            <a href="/#partners">Bus partners</a>
            <a href="/#operators">For bus companies</a>
            {user ? <NavLink to="/account">Account</NavLink> : <NavLink to="/sign-in">Sign in</NavLink>}
          </nav>
        </div>
      </header>
      <main id="main">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="wrap">
          <div>
            <div className="row" style={{ gap: 10 }}><Logo size={30} /><strong style={{ fontFamily: 'var(--display)', fontSize: 18 }}>Bemengede</strong></div>
            {/* Business details: who runs the service and how to reach them. */}
            <address style={{ fontStyle: 'normal', marginTop: 10 }} className="muted">
              {b ? (
                <>
                  {b.legal_name}<br />
                  {b.address}<br />
                  TIN {b.tin} · Trade licence {b.trade_license_no}<br />
                  <a href={`tel:${b.phone.replace(/\s/g, '')}`}>{b.phone}</a> · <a href={`mailto:${b.email}`}>{b.email}</a><br />
                  Support: {b.support_hours}
                </>
              ) : 'Loading company details…'}
            </address>
          </div>
          <nav aria-label="Legal">
            <strong>Policies</strong>
            <ul>
              <li><Link to="/terms">Terms of Service</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/refunds">Refund Policy</Link></li>
              <li><Link to="/cookies">Cookie Policy</Link></li>
              <li><button className="linklike" onClick={openSettings}>Cookie settings</button></li>
            </ul>
          </nav>
          <nav aria-label="Help">
            <strong>Help</strong>
            <ul>
              <li><Link to="/my-trips">Find or cancel a booking</Link></li>
              <li><Link to="/account">Download or delete my data</Link></li>
              <li><a href="/#operators">Become a bus partner</a></li>
            </ul>
          </nav>
        </div>
      </footer>
      <CookieConsent />
    </>
  );
}
