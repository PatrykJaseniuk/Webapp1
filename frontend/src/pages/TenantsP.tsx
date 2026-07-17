import { TenantsM } from '@/masterComponents/TenantsM';
import { TenantsS } from '@/slaveComponents/TenantsS';

export const TenantsListPage = (): JSX.Element => (
  <TenantsM TableComponent={TenantsS} />
);
