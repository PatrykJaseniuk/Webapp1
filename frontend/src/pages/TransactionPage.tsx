import { transactionDetailRoute } from '@/main/routes';
import { TransactionDetailM } from '@/masterComponents/TransactionM';
import { TransactionDetailS } from '@/slaveComponents/TransactionS';

export const TransactionDetailPage = (): JSX.Element => {
  const { id } = transactionDetailRoute.useParams();
  return <TransactionDetailM Slave={TransactionDetailS} id={id} />;
};
