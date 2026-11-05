import { useId, type InputHTMLAttributes } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string };

/** Label, hint and error are all programmatically tied to the input. */
export default function Field({ label, hint, error, ...input }: Props) {
  const id = useId();
  const describedBy = [hint && `${id}-hint`, error && `${id}-err`].filter(Boolean).join(' ') || undefined;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {hint && <span id={`${id}-hint`} className="hint">{hint}</span>}
      <input id={id} aria-invalid={!!error} aria-describedby={describedBy} {...input} />
      {error && <span id={`${id}-err`} className="error" role="alert">{error}</span>}
    </div>
  );
}
