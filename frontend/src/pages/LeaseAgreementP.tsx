import { leaseDetailRoute } from '@/main/routes';
import { LeaseAgreementDetailM } from '@/masterComponents/LeaseAgreementM';
import { LeaseAgreementDetailS } from '@/slaveComponents/LeaseAgreementS';

export const LeaseAgreementDetailPage = (): JSX.Element => {
  const { id } = leaseDetailRoute.useParams();
  return <LeaseAgreementDetailM Slave={LeaseAgreementDetailS} id={id} />;
};
