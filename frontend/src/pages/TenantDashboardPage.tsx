import { AuthorisationGuard } from '@/masterComponents/RoleGuard';
import { TenantDashboard } from '@/slaveComponents/TenantDashboard';

export const TenantDashboardPage = (): JSX.Element => (
  <AuthorisationGuard
    authoriseRequirement={{
      isAuthenticated: true,
      roles: ['tenant'],
    }}
  >
    <TenantDashboard />
  </AuthorisationGuard>
);