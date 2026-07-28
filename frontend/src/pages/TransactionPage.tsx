import { transactionDetailRoute } from '@/main/routes';
import { AuthorisationGuard } from '@/masterComponents/RoleGuardM';
import { TransactionDetailM } from '@/masterComponents/TransactionM';
import { TransactionDetailS } from '@/slaveComponents/TransactionS';
import { AccessGateS } from '@/slaveComponents/AccessGateS';

export const TransactionDetailPage = (): JSX.Element => {
  const { id } = transactionDetailRoute.useParams();

  return (
    <AuthorisationGuard
      authoriseRequirement={{ isAuthenticated: true, roles: ['admin', 'landlord', 'tenant'] }}
      Slave={AccessGateS}
    >
      <TransactionDetailM Slave={TransactionDetailS} id={id} />
    </AuthorisationGuard>
  );
};