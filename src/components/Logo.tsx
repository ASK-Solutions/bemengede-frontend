export default function Logo({ size = 38 }: { size?: number }) {
  // Decorative next to the visible "Bemengede" wordmark, so hidden from screen readers.
  return (
    <span className="logo" aria-hidden="true" style={{ width: size, height: size, fontSize: size * 0.52 }}>
      በ
    </span>
  );
}
