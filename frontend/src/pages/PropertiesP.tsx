import { useLocation } from 'react-router-dom';
import { PropertiesList } from '@/masterComponents/PropertiesM';
import { PropertiesS } from '@/slaveComponents/PropertiesS';

export const PropertiesListPage = (): JSX.Element => {
  const { pathname } = useLocation();

  const basePath = pathname.endsWith('/properties') ? pathname : pathname.replace(/\/+$/, '');
  const rolePrefix = basePath.replace(/\/properties$/, '');

  const getDetailUrl = (id: string): string => `#${basePath}/${id}`;
  const getTenantUrl = (tenantId: string): string => `#${rolePrefix}/tenants/${tenantId}`;

  return (
    <PropertiesList
      TableComponent={PropertiesS}
      getDetailUrl={getDetailUrl}
      getTenantUrl={getTenantUrl}
    />
  );
};