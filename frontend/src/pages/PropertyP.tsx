import { propertyDetailRoute } from '@/main/routes';
import { AuthorisationGuard } from '@/masterComponents/RoleGuardM';
import { PropertyDetailM } from '@/masterComponents/PropertyM';
import { PropertyDetailS } from '@/slaveComponents/PropertyS';
import { AccessGateS } from '@/slaveComponents/AccessGateS';

export const PropertyDetailPage = (): JSX.Element => {
  const { id } = propertyDetailRoute.useParams();

  return (
    <AuthorisationGuard
      authoriseRequirement={{ isAuthenticated: true, roles: ['admin', 'landlord'] }}
      Slave={AccessGateS}
    >
      <PropertyDetailM Slave={PropertyDetailS} id={id} />
    </AuthorisationGuard>
  );
};