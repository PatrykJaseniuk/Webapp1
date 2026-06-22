import { AuthorisationGuard } from '@/masterComponents/RoleGuard';
import { AdminDashboard } from '@/slaveComponents/AdminDashboard';
import { LoadingSpinner } from '@/slaveComponents/LoadingSpinner';
import { AccessDenied } from '@/slaveComponents/AccessDenied';

export const AdminDashboardPage = (): JSX.Element => (
  <AuthorisationGuard
    authoriseRequirement={{
      isAuthenticated: true,
      roles: ['admin']
    }}
    LoadingComponent={<LoadingSpinner />}
    AccessDeniedComponent={<AccessDenied />}
  >
    <AdminDashboard />
  </AuthorisationGuard>
);
