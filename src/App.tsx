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
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import Account from './pages/Account';
import Legal from './pages/Legal';
import Unsubscribe from './pages/Unsubscribe';
import NotFound from './pages/NotFound';
import StaffLogin from './staff/StaffLogin';
import AcceptInvite from './staff/AcceptInvite';
import { AdminPortal, OperatorPortal } from './staff/Portals';
import OpDashboard from './staff/operator/Dashboard';
import OpTrips from './staff/operator/Trips';
import OpBookings from './staff/operator/Bookings';
import OpCounter from './staff/operator/CounterSale';
import OpVerifications from './staff/operator/Verifications';
import OpBoarding from './staff/operator/Boarding';
import OpFleet from './staff/operator/Fleet';
import OpRoutes from './staff/operator/Routes';
import OpStaff from './staff/operator/Staff';
import OpPayouts from './staff/operator/Payouts';
import OpReports from './staff/operator/Reports';
import OpSettings from './staff/operator/Settings';
import AdOverview from './staff/admin/Overview';
import AdOperators from './staff/admin/Operators';
import AdPayments from './staff/admin/Payments';
import AdSettlements from './staff/admin/Settlements';
import AdDisputes from './staff/admin/Disputes';
import AdCities from './staff/admin/Cities';
import AdAudit from './staff/admin/Audit';

export default function App() {
  const { pathname } = useLocation();
  // Move focus to the main heading on navigation so screen-reader users hear the new page.
  useEffect(() => {
    window.scrollTo(0, 0);
    const h1 = document.querySelector('main h1, #portal-main h1') as HTMLElement | null;
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
        <Route path="sign-up" element={<SignUp />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="account" element={<Account />} />
        <Route path="privacy" element={<Legal doc="privacy" />} />
        <Route path="terms" element={<Legal doc="terms" />} />
        <Route path="refunds" element={<Legal doc="refund" />} />
        <Route path="cookies" element={<Legal doc="cookies" />} />
        <Route path="unsubscribe/:token" element={<Unsubscribe />} />
        <Route path="staff/login" element={<StaffLogin />} />
        <Route path="staff/accept/:token" element={<AcceptInvite />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="operator" element={<OperatorPortal />}>
        <Route index element={<OpDashboard />} />
        <Route path="trips" element={<OpTrips />} />
        <Route path="bookings" element={<OpBookings />} />
        <Route path="counter" element={<OpCounter />} />
        <Route path="verifications" element={<OpVerifications />} />
        <Route path="boarding" element={<OpBoarding />} />
        <Route path="fleet" element={<OpFleet />} />
        <Route path="routes" element={<OpRoutes />} />
        <Route path="staff" element={<OpStaff />} />
        <Route path="payouts" element={<OpPayouts />} />
        <Route path="reports" element={<OpReports />} />
        <Route path="settings" element={<OpSettings />} />
      </Route>
      <Route path="admin" element={<AdminPortal />}>
        <Route index element={<AdOverview />} />
        <Route path="operators" element={<AdOperators />} />
        <Route path="payments" element={<AdPayments />} />
        <Route path="settlements" element={<AdSettlements />} />
        <Route path="disputes" element={<AdDisputes />} />
        <Route path="cities" element={<AdCities />} />
        <Route path="audit" element={<AdAudit />} />
      </Route>
    </Routes>
  );
}
