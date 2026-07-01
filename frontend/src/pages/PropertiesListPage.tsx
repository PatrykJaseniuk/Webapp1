import { useLocation } from 'react-router-dom';
import { PropertiesMany } from '@/masterComponents/PropertiesMany';
import { PropertiesTable } from '@/slaveComponents/PropertiesTable';
import { LoadingSpinner } from '@/slaveComponents/LoadingSpinner';
import { ErrorMessage } from '@/slaveComponents/ErrorMessage';

export const PropertiesListPage = (): JSX.Element => {
  const { pathname } = useLocation();

  const basePath = pathname.endsWith('/properties') ? pathname : pathname.replace(/\/+$/, '');

  const getEditUrl = (id: string): string => `#${basePath}/${id}`;

  return (
    <PropertiesMany
      TableComponent={PropertiesTable}
      LoadingComponent={<LoadingSpinner />}
      ErrorComponent={ErrorMessage}
      getEditUrl={getEditUrl}
    />
  );
};