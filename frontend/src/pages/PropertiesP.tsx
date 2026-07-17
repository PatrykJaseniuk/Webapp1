import { PropertiesM } from '@/masterComponents/PropertiesM';
import { PropertiesS } from '@/slaveComponents/PropertiesS';

export const PropertiesListPage = (): JSX.Element => (
  <PropertiesM Slave={PropertiesS} />
);
