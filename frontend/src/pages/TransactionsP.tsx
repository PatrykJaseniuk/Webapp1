import { TransactionsM } from '@/masterComponents/TransactionsM';
import { TransactionsS } from '@/slaveComponents/TransactionsS';

export const TransactionsListPage = (): JSX.Element => (
  <TransactionsM Slave={TransactionsS} />
);
