import { useParams } from '@tanstack/react-router';
import { PropertyDetailM } from '@/masterComponents/PropertyM';
import { PropertyDetailS } from '@/slaveComponents/PropertyS';

type Params = Readonly<{
  id: string;
}>;

export const PropertyDetailPage = (): JSX.Element => {
  const { id } = useParams({ strict: false }) as Params;
  return <PropertyDetailM Slave={PropertyDetailS} id={id} />;
};
