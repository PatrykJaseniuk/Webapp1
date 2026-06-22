import { AuthorisationGuard } from '@/masterComponents/RoleGuard';
import { AdminDashboard } from '@/slaveComponents/AdminDashboard';

export const AdminDashboardPage = (): JSX.Element => (
  <AuthorisationGuard
    authoriseRequirement={{
      isAuthenticated: true,
      roles: ['admin']
    }}>
    <AdminDashboard />
  </AuthorisationGuard>
);