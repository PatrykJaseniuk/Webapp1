import { propertyDetailRoute } from '@/main/routes';
import { PropertyDetailM } from '@/masterComponents/PropertyM';
import { PropertyDetailS } from '@/slaveComponents/PropertyS';

export const PropertyDetailPage = (): JSX.Element => {
  const { id } = propertyDetailRoute.useParams();
  return <PropertyDetailM Slave={PropertyDetailS} id={id} />;
};
