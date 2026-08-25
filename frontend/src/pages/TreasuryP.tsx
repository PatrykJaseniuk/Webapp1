import { match } from 'ts-pattern';
import { treasuryDetailRoute } from '@/main/routes';
import { useAuth } from '@/hooks/AuthContext';
import { TreasuryDetailM, type TreasuryDetailMode } from '@/masterComponents/TreasuryM';
import { AccessDeniedM } from '@/masterComponents/AccessDeniedM';
import { TreasuryDetailS } from '@/slaveComponents/TreasuryS';
import { AccessDeniedS } from '@/slaveComponents/AccessDeniedS';
import { LoadingSpinner } from '@/slaveComponents/LoadingSpinnerS';

export const TreasuryDetailPage = (): JSX.Element => {
  const { id } = treasuryDetailRoute.useParams();
  const mode: TreasuryDetailMode = id === 'new' ? { tag: 'create' } : { tag: 'edit', id };
  const authState = useAuth();

  return match(authState)
    .with({ tag: 'loading' }, () => <LoadingSpinner />)
    .with({ tag: 'unauthenticated' }, () => <AccessDeniedM Slave={AccessDeniedS} />)
    .with({ tag: 'authenticated', role: 'admin' }, () => <TreasuryDetailM Slave={TreasuryDetailS} mode={mode} />)
    .with({ tag: 'authenticated', role: 'landlord' }, () => <TreasuryDetailM Slave={TreasuryDetailS} mode={mode} />)
    .with({ tag: 'authenticated', role: 'tenant' }, () => <AccessDeniedM Slave={AccessDeniedS} />)
    .exhaustive();
};
