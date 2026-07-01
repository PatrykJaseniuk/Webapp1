import { TenantsMany } from '@/masterComponents/TenantsMany';
import { TenantsTable } from '@/slaveComponents/TenantsTable';
import { LoadingSpinner } from '@/slaveComponents/LoadingSpinner';
import { ErrorMessage } from '@/slaveComponents/ErrorMessage';

export const TenantsListPage = (): JSX.Element => (
  <TenantsMany
    TableComponent={TenantsTable}
    LoadingComponent={<LoadingSpinner />}
    ErrorComponent={ErrorMessage}
    getEditUrl={(id: string): string => `#/tenants/${id}`}
  />
);