import { useParams } from '@tanstack/react-router';
import { TransactionDetail } from '@/masterComponents/TransactionM';
import { TransactionDetailView } from '@/slaveComponents/TransactionS';

type Params = Readonly<{
  id: string;
}>;

export const TransactionDetailPage = (): JSX.Element => {
  const { id } = useParams({ strict: false }) as Params;
  return <TransactionDetail DetailViewComponent={TransactionDetailView} id={id} />;
};
