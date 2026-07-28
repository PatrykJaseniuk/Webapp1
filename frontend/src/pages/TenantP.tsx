import { tenantDetailRoute } from '@/main/routes';
import { AuthorisationGuard } from '@/masterComponents/RoleGuardM';
import { TenantDetailM } from '@/masterComponents/TenantM';
import { TenantDetailS } from '@/slaveComponents/TenantS';
import { AccessGateS } from '@/slaveComponents/AccessGateS';

export const TenantDetailPage = (): JSX.Element => {
  const { id } = tenantDetailRoute.useParams();

  return (
    <AuthorisationGuard
      authoriseRequirement={{ isAuthenticated: true, roles: ['admin', 'landlord'] }}
      Slave={AccessGateS}
    >
      <TenantDetailM Slave={TenantDetailS} id={id} />
    </AuthorisationGuard>
  );
};