import type { CSSProperties } from 'react';

type Props = { from: string; to: string; stops: [string, number][] };

/** Animated road. Purely decorative motion; the same facts are in the text above it. */
export default function BusRoute({ from, to, stops }: Props) {
  const stop = (name: string, pct: number, end: boolean) => {
    const pos = pct === 0 ? { left: 0, alignItems: 'flex-start' } : pct === 100 ? { right: 0, alignItems: 'flex-end' } : { left: `${pct}%`, transform: 'translateX(-50%)', alignItems: 'center' };
    return (
      <li key={name} className={`stop ${end ? 'end' : 'mid'}`} style={pos as CSSProperties}>
        <i aria-hidden="true" /><span>{name}</span>
      </li>
    );
  };
  return (
    <div className="road">
      <div className="asphalt" aria-hidden="true" />
      <div className="lane" aria-hidden="true" />
      <ol aria-label={`Stops from ${from} to ${to}`} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {stop(from, 0, true)}
        {stops.map(([n, p]) => stop(n, p, false))}
        {stop(to, 100, true)}
      </ol>
      <svg className="bus" width="56" height="30" viewBox="0 0 56 30" aria-hidden="true">
        <rect x="2" y="2" width="50" height="20" rx="5" fill="#F2B33D" />
        <rect x="7" y="6" width="9" height="7" rx="1.5" fill="#123F34" /><rect x="19" y="6" width="9" height="7" rx="1.5" fill="#123F34" />
        <rect x="31" y="6" width="9" height="7" rx="1.5" fill="#123F34" /><rect x="43" y="6" width="6" height="11" rx="1.5" fill="#123F34" />
        <circle cx="13" cy="23" r="4" fill="#14211D" stroke="#F5F6F3" strokeWidth="2" /><circle cx="41" cy="23" r="4" fill="#14211D" stroke="#F5F6F3" strokeWidth="2" />
      </svg>
    </div>
  );
}
