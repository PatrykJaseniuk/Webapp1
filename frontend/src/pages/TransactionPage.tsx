import { useParams } from 'react-router-dom';
import { TransactionDetail } from '@/masterComponents/TransactionM';
import { TransactionDetailView } from '@/slaveComponents/TransactionS';

export const TransactionDetailPage = (): JSX.Element => {
  const { id } = useParams<{ readonly id: string }>();
  return <TransactionDetail DetailViewComponent={TransactionDetailView} id={id!} />;
};
