import { transactionDetailRoute } from '@/main/routes';
import { TransactionDetail } from '@/masterComponents/TransactionM';
import { TransactionDetailView } from '@/slaveComponents/TransactionS';

export const TransactionDetailPage = (): JSX.Element => {
  const { id } = transactionDetailRoute.useParams();
  return <TransactionDetail DetailViewComponent={TransactionDetailView} id={id} />;
};
