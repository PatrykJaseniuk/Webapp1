import { tenantDetailRoute } from '@/main/routes';
import { TenantDetailM } from '@/masterComponents/TenantM';
import { TenantDetailS } from '@/slaveComponents/TenantS';

export const TenantDetailPage = (): JSX.Element => {
  const { id } = tenantDetailRoute.useParams();
  return <TenantDetailM DetailViewComponent={TenantDetailS} id={id} />;
};
