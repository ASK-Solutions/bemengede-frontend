import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useConsent } from '../lib/consent';

/** Banner on first visit + a settings dialog reachable from the footer at any time. */
export default function CookieConsent() {
  const { choice, decide, settingsOpen, closeSettings } = useConsent();
  const dialog = useRef<HTMLDialogElement>(null);
  const [analytics, setAnalytics] = useState(choice?.analytics ?? false);

  useEffect(() => {
    if (settingsOpen) { setAnalytics(choice?.analytics ?? false); dialog.current?.showModal(); }
    else dialog.current?.close();
  }, [settingsOpen, choice]);

  return (
    <>
      {!choice && !settingsOpen && (
        <section className="cookie" role="region" aria-labelledby="cookie-title">
          <h2 id="cookie-title" style={{ fontSize: 20 }}>Your cookie choice</h2>
          <p className="small">
            We use only the storage needed to run bookings. With your permission, we would also measure which pages work
            (no advertising, no cross-site tracking). <Link to="/cookies">Cookie Policy</Link>
          </p>
          {/* Equal-weight choices: same size, same style, no pre-selected option. */}
          <div className="actions">
            <button className="btn btn-ghost" onClick={() => decide(false)}>Reject optional</button>
            <button className="btn btn-ghost" onClick={() => decide(true)}>Allow analytics</button>
          </div>
        </section>
      )}
      <dialog ref={dialog} aria-labelledby="cookie-settings-title" onClose={closeSettings}>
        <form method="dialog" className="stack" onSubmit={(e) => { e.preventDefault(); decide(analytics); }}>
          <h2 id="cookie-settings-title" style={{ fontSize: 24 }}>Cookie settings</h2>
          <div className="card stack" style={{ padding: 16 }}>
            <label className="check">
              <input type="checkbox" checked disabled aria-describedby="nec-desc" />
              <span><strong>Strictly necessary</strong><br /><span id="nec-desc" className="muted small">Remembers this choice, keeps you signed in for this tab and holds your booking while you pay. Always on.</span></span>
            </label>
            <label className="check">
              <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} aria-describedby="an-desc" />
              <span><strong>Analytics</strong><br /><span id="an-desc" className="muted small">Aggregated statistics about which pages are used. Off unless you switch it on.</span></span>
            </label>
          </div>
          <div className="row">
            <button type="submit" className="btn btn-primary">Save choice</button>
            <button type="button" className="btn btn-ghost" onClick={closeSettings}>Cancel</button>
          </div>
        </form>
      </dialog>
    </>
  );
}
