import { useParams } from '@tanstack/react-router';
import { TenantDetailM } from '@/masterComponents/TenantM';
import { TenantDetailS } from '@/slaveComponents/TenantS';

type Params = Readonly<{
  id: string;
}>;

export const TenantDetailPage = (): JSX.Element => {
  const { id } = useParams({ strict: false }) as Params;
  return <TenantDetailM DetailViewComponent={TenantDetailS} id={id} />;
};
