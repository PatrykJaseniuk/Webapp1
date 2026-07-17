import { useParams } from 'react-router-dom';
import { TenantDetailM } from '@/masterComponents/TenantM';
import { TenantDetailS } from '@/slaveComponents/TenantS';

export const TenantDetailPage = (): JSX.Element => {
  const { id } = useParams<{ readonly id: string }>();
  return <TenantDetailM DetailViewComponent={TenantDetailS} id={id!} />;
};
