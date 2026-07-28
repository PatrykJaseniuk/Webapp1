import { AuthorisationGuard } from '@/masterComponents/RoleGuardM';
import { TransactionsM } from '@/masterComponents/TransactionsM';
import { TransactionsS } from '@/slaveComponents/TransactionsS';
import { AccessGateS } from '@/slaveComponents/AccessGateS';

export const TransactionsListPage = (): JSX.Element => (
  <AuthorisationGuard
    authoriseRequirement={{ isAuthenticated: true, roles: ['admin', 'landlord', 'tenant'] }}
    Slave={AccessGateS}
  >
    <TransactionsM Slave={TransactionsS} />
  </AuthorisationGuard>
);