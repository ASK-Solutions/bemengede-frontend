import { Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Search from './pages/Search';
import TripSeats from './pages/TripSeats';
import Checkout from './pages/Checkout';
import Pay from './pages/Pay';
import MockPay from './pages/MockPay';
import BookingPage from './pages/Booking';
import MyTrips from './pages/MyTrips';
import SignIn from './pages/SignIn';
import Account from './pages/Account';
import Legal from './pages/Legal';
import Unsubscribe from './pages/Unsubscribe';
import NotFound from './pages/NotFound';

export default function App() {
  const { pathname } = useLocation();
  // Move focus to the main heading on navigation so screen-reader users hear the new page.
  useEffect(() => {
    window.scrollTo(0, 0);
    const h1 = document.querySelector('main h1') as HTMLElement | null;
    if (h1) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
  }, [pathname]);

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Landing />} />
        <Route path="search" element={<Search />} />
        <Route path="trips/:id" element={<TripSeats />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="pay/mock" element={<MockPay />} />
        <Route path="pay/:reference" element={<Pay />} />
        <Route path="booking/:reference" element={<BookingPage />} />
        <Route path="my-trips" element={<MyTrips />} />
        <Route path="sign-in" element={<SignIn />} />
        <Route path="account" element={<Account />} />
        <Route path="privacy" element={<Legal doc="privacy" />} />
        <Route path="terms" element={<Legal doc="terms" />} />
        <Route path="refunds" element={<Legal doc="refund" />} />
        <Route path="cookies" element={<Legal doc="cookies" />} />
        <Route path="unsubscribe/:token" element={<Unsubscribe />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
