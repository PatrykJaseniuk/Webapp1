import { useLocation } from 'react-router-dom';
import { TenantsM } from '@/masterComponents/TenantsM';
import { TenantsS } from '@/slaveComponents/TenantsS';

export const TenantsListPage = (): JSX.Element => {
  const { pathname } = useLocation();

  const basePath = pathname.endsWith('/tenants') ? pathname : pathname.replace(/\/+$/, '');
  const rolePrefix = basePath.replace(/\/tenants$/, '');

  const getDetailUrl = (id: string): string => `${basePath}/${id}`;
  const getPropertyUrl = (propertyId: string): string => `${rolePrefix}/properties/${propertyId}`;

  return (
    <TenantsM
      TableComponent={TenantsS}
      getDetailUrl={getDetailUrl}
      getPropertyUrl={getPropertyUrl}
    />
  );
};