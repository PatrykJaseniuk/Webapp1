import { match } from 'ts-pattern';
import { useAuth } from '@/hooks/AuthContext';
import { FinancialEntriesM } from '@/masterComponents/FinancialEntriesM';
import { AccessDeniedM } from '@/masterComponents/AccessDeniedM';
import { FinancialEntriesS } from '@/slaveComponents/FinancialEntriesS';
import { AccessDeniedS } from '@/slaveComponents/AccessDeniedS';
import { LoadingSpinner } from '@/slaveComponents/LoadingSpinnerS';

export const FinancialEntriesListPage = (): JSX.Element => {
  const authState = useAuth();

  return match(authState)
    .with({ tag: 'loading' }, () => <LoadingSpinner />)
    .with({ tag: 'unauthenticated' }, () => <AccessDeniedM Slave={AccessDeniedS} />)
    .with({ tag: 'authenticated', role: 'admin' }, () => <FinancialEntriesM Slave={FinancialEntriesS} role="admin" />)
    .with({ tag: 'authenticated', role: 'landlord' }, () => <FinancialEntriesM Slave={FinancialEntriesS} role="landlord" />)
    .with({ tag: 'authenticated', role: 'tenant' }, () => <FinancialEntriesM Slave={FinancialEntriesS} role="tenant" />)
    .exhaustive();
};
