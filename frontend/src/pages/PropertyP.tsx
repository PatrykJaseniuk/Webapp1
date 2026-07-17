import { useParams } from 'react-router-dom';
import { PropertyDetailM } from '@/masterComponents/PropertyM';
import { PropertyDetailS } from '@/slaveComponents/PropertyS';

export const PropertyDetailPage = (): JSX.Element => {
  const { id } = useParams<{ readonly id: string }>();
  return <PropertyDetailM Slave={PropertyDetailS} id={id!} />;
};
