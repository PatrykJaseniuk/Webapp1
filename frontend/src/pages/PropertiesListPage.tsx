import { PropertiesMany } from '@/masterComponents/PropertiesMany';
import { PropertiesTable } from '@/slaveComponents/PropertiesTable';
import { LoadingSpinner } from '@/slaveComponents/LoadingSpinner';
import { ErrorMessage } from '@/slaveComponents/ErrorMessage';

export const PropertiesListPage = (): JSX.Element => (
  <PropertiesMany
    TableComponent={PropertiesTable}
    LoadingComponent={<LoadingSpinner />}
    ErrorComponent={ErrorMessage}
  />
);