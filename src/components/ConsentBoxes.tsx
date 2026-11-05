import { Link } from 'react-router-dom';

/** The two boxes every new account must tick. Never pre-ticked. */
export default function ConsentBoxes({ adult, terms, setAdult, setTerms, errors }: {
  adult: boolean; terms: boolean; setAdult: (v: boolean) => void; setTerms: (v: boolean) => void; errors?: { adult?: string; terms?: string };
}) {
  return (
    <fieldset className="stack" style={{ border: 'none', padding: 0, margin: 0, gap: 8 }}>
      <legend className="sr-only">Before creating your account</legend>
      <label className="check">
        <input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} aria-invalid={!!errors?.adult} />
        <span>I am 18 or older. (Under 18? Ask a parent or guardian to book for you.)</span>
      </label>
      {errors?.adult && <span className="error" role="alert">{errors.adult}</span>}
      <label className="check">
        <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} aria-invalid={!!errors?.terms} />
        <span>I agree to the <Link to="/terms" target="_blank">Terms of Service</Link> and have read the <Link to="/privacy" target="_blank">Privacy Policy</Link>.</span>
      </label>
      {errors?.terms && <span className="error" role="alert">{errors.terms}</span>}
    </fieldset>
  );
}
