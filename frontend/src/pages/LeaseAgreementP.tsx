import { Route, useParams } from '@tanstack/react-router';
import { LeaseAgreementDetailM } from '@/masterComponents/LeaseAgreementM';
import { LeaseAgreementDetailS } from '@/slaveComponents/LeaseAgreementS';

type Params = Readonly<{
  id: string;
}>;

export const LeaseAgreementDetailPage = (): JSX.Element => {
  const { id } = useParams({ strict: false }) as Params;
  const param = 
  return <LeaseAgreementDetailM Slave={LeaseAgreementDetailS} id={id} />;
};
