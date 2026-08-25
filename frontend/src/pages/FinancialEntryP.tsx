import { match } from 'ts-pattern';
import { financialEntryDetailRoute } from '@/main/routes';
import { useAuth } from '@/hooks/AuthContext';
import { FinancialEntryDetailM, type FinancialEntryDetailMode } from '@/masterComponents/FinancialEntryM';
import { AccessDeniedM } from '@/masterComponents/AccessDeniedM';
import { FinancialEntryDetailS } from '@/slaveComponents/FinancialEntryS';
import { AccessDeniedS } from '@/slaveComponents/AccessDeniedS';
import { LoadingSpinner } from '@/slaveComponents/LoadingSpinnerS';

export const FinancialEntryDetailPage = (): JSX.Element => {
  const { id } = financialEntryDetailRoute.useParams();
  const mode: FinancialEntryDetailMode = id === 'new' ? { tag: 'create' } : { tag: 'edit', id };
  const authState = useAuth();

  return match(authState)
    .with({ tag: 'loading' }, () => <LoadingSpinner />)
    .with({ tag: 'unauthenticated' }, () => <AccessDeniedM Slave={AccessDeniedS} />)
    .with({ tag: 'authenticated', role: 'admin' }, () => <FinancialEntryDetailM Slave={FinancialEntryDetailS} mode={mode} />)
    .with({ tag: 'authenticated', role: 'landlord' }, () => <FinancialEntryDetailM Slave={FinancialEntryDetailS} mode={mode} />)
    .with({ tag: 'authenticated', role: 'tenant' }, () => <AccessDeniedM Slave={AccessDeniedS} />)
    .exhaustive();
};