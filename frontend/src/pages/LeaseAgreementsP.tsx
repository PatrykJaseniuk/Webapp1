import { LeaseAgreementsM } from '@/masterComponents/LeaseAgreementsM';
import { LeaseAgreementsS } from '@/slaveComponents/LeaseAgreementsS';

export const LeaseAgreementsListPage = (): JSX.Element => (
  <LeaseAgreementsM Slave={LeaseAgreementsS} />
);
