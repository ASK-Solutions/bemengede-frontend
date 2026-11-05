type Props = {
  seatCount: number;
  columns: number;
  aisleAfter: number;
  unavailable: number[];
  selected: number[];
  onToggle: (seat: number) => void;
};

/** Every seat is a real button: reachable with Tab, toggled with Enter/Space, state announced via aria-pressed. */
export default function SeatMap({ seatCount, columns, aisleAfter, unavailable, selected, onToggle }: Props) {
  const rows: number[][] = [];
  for (let s = 1; s <= seatCount; s += columns) rows.push(Array.from({ length: Math.min(columns, seatCount - s + 1) }, (_, i) => s + i));

  return (
    <div className="seatmap" role="group" aria-label="Seat map. Front of the bus is at the top.">
      <div className="row between small muted" aria-hidden="true" style={{ borderBottom: '1px dashed var(--line)', paddingBottom: 8 }}>
        <span>Door</span><span>Driver</span>
      </div>
      {rows.map((row, r) => (
        <div className="seatrow" key={r}>
          {row.map((n, i) => {
            const taken = unavailable.includes(n);
            const on = selected.includes(n);
            const window = i === 0 || i === columns - 1;
            return (
              <span key={n} style={{ display: 'contents' }}>
                {i === aisleAfter && <span className="aisle" aria-hidden="true" />}
                <button
                  type="button"
                  className="seat"
                  disabled={taken}
                  aria-pressed={on}
                  aria-label={`Seat ${n}, ${window ? 'window' : 'aisle'}${taken ? ', taken' : ''}`}
                  onClick={() => onToggle(n)}
                >
                  {n}
                </button>
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}
