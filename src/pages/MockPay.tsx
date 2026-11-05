import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';

/** Development stand-in for the telebirr / Chapa page (PAYMENTS_MODE=mock only). */
export default function MockPay() {
  const [p] = useSearchParams();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const provider = p.get('provider') === 'chapa' ? 'Chapa' : 'telebirr';
  const tx = p.get('tx_ref') ?? '';

  const pay = async () => {
    setBusy(true);
    const r = await api<{ reference: string }>(`/payments/${tx}/mock-complete`, { method: 'POST' });
    nav(`/booking/${r.reference}`);
  };

  return (
    <div className="narrow stack">
      <p className="alert">Test mode: this page stands in for {provider}. No real money moves.</p>
      <h1 style={{ fontSize: 32 }}>{provider} checkout (simulated)</h1>
      <div className="row">
        <button className="btn btn-primary" onClick={pay} disabled={busy}>Simulate successful payment</button>
        <button className="btn btn-ghost" onClick={() => history.back()}>Cancel</button>
      </div>
    </div>
  );
}
