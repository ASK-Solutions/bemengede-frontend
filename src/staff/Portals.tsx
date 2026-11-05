import PortalShell from './PortalShell';
import { useLoad } from './ui';

/** Operator portal frame; shows how many transfers are waiting next to the menu item. */
export function OperatorPortal() {
  const [d] = useLoad<{ kpis: { pending_verifications: number } }>('/operator/dashboard');
  return (
    <PortalShell area="Operator portal" roles={['operator_owner', 'operator_agent']} items={[
      ['/operator', 'Dashboard'],
      ['/operator/trips', 'Trips & schedules'],
      ['/operator/bookings', 'Bookings'],
      ['/operator/counter', 'Counter sale'],
      ['/operator/verifications', 'Payment verifications', d?.kpis.pending_verifications],
      ['/operator/boarding', 'Boarding & manifests'],
      ['/operator/fleet', 'Fleet & drivers'],
      ['/operator/routes', 'Routes'],
      ['/operator/staff', 'Staff & roles'],
      ['/operator/payouts', 'Payouts & finance'],
      ['/operator/reports', 'Reports'],
      ['/operator/settings', 'Company settings'],
    ]} />
  );
}

export function AdminPortal() {
  return (
    <PortalShell area="Platform admin" roles={['platform_admin']} items={[
      ['/admin', 'Overview'],
      ['/admin/operators', 'Operators'],
      ['/admin/payments', 'Payments & refunds'],
      ['/admin/settlements', 'Settlements'],
      ['/admin/disputes', 'Disputes'],
      ['/admin/cities', 'Cities & terminals'],
      ['/admin/audit', 'Audit log'],
    ]} />
  );
}
