import { useParams } from 'react-router-dom';
import { LeaseAgreementDetailM } from '@/masterComponents/LeaseAgreementM';
import { LeaseAgreementDetailS } from '@/slaveComponents/LeaseAgreementS';

export const LeaseAgreementDetailPage = (): JSX.Element => {
  const { id } = useParams<{ readonly id: string }>();
  return <LeaseAgreementDetailM Slave={LeaseAgreementDetailS} id={id!} />;
};
