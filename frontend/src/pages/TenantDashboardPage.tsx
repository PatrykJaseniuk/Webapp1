import { AuthorisationGuard } from '@/masterComponents/RoleGuard';
import { TenantDashboard } from '@/slaveComponents/TenantDashboard';
import { LoadingSpinner } from '@/slaveComponents/LoadingSpinner';
import { AccessDenied } from '@/slaveComponents/AccessDenied';

export const TenantDashboardPage = (): JSX.Element => (
  <AuthorisationGuard
    authoriseRequirement={{
      isAuthenticated: true,
      roles: ['tenant'],
    }}
    LoadingComponent={<LoadingSpinner />}
    AccessDeniedComponent={<AccessDenied />}
  >
    <TenantDashboard />
  </AuthorisationGuard>
);
