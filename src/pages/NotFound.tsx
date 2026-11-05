import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="narrow stack">
      <h1 style={{ fontSize: 34 }}>Page not found</h1>
      <p><Link to="/">Go to the home page</Link> or <Link to="/my-trips">find a booking</Link>.</p>
    </div>
  );
}
