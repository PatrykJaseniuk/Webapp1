import { useLocation } from 'react-router-dom';
import { TenantsMany } from '@/masterComponents/TenantsMany';
import { TenantsTable } from '@/slaveComponents/TenantsTable';

export const TenantsListPage = (): JSX.Element => {
  const { pathname } = useLocation();

  const basePath = pathname.endsWith('/tenants') ? pathname : pathname.replace(/\/+$/, '');

  const getEditUrl = (id: string): string => `#${basePath}/${id}`;

  return (
    <TenantsMany
      TableComponent={TenantsTable}
      getEditUrl={getEditUrl}
    />
  );
};
