import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import type { ComponentType} from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';
import { toAsyncData, type AsyncData } from '@/generic';
import { NavLinkWithId } from '@/generic/utils';

type LeaseAgreementDbRow = Database['public']['Tables']['lease_agreements']['Row']
type LeaseAgreementRow = LeaseAgreementDbRow & {
  readonly tenants: { readonly first_name: string; readonly last_name: string; };
  readonly properties: { readonly name: string; };
};


type NavLinkTo = Readonly<{
  readonly leaseAgreement: NavLinkWithId,
  readonly tenant: NavLinkWithId,
  readonly property: NavLinkWithId
}>

export type LeaseAgreementsSProps = {
  readonly asyncData: AsyncData<readonly LeaseAgreementRow[]>,
  readonly navLinkTo: NavLinkTo  
};

type Props = {
  readonly Slave: ComponentType<LeaseAgreementsSProps>;
};

export const LeaseAgreementsM = ({
  Slave,
}: Props): JSX.Element => {
  const query = useQuery({
    queryKey: ['lease_agreements'],
    queryFn: async (): Promise<readonly LeaseAgreementRow[]> => {
      const r = await backendConnector
        .from('lease_agreements')
        .select('*, tenants(first_name,last_name), properties(name)');
      if (r.error !== null) throw r.error;
      return r.data ?? [];
    },
  });

  const asyncData = toAsyncData(query, () => { query.refetch(); });

  const navLinkTo:NavLinkTo ={
      leaseAgreement: ({content,id,style})=><Link to='/app/leases/$id' params={{id :id}} style={style}>{content}</Link>,
      tenant: ({content,id,style})=><Link to='/app/tenants/$id' params={{id:id}} style = {style}> {content}</Link>,
      property: ({content,id,style})=><Link to='/app/properties/$id' params={{id:id}} style={style}>{content}</Link>
    }  

  return (
    <Slave
      asyncData={asyncData}
      navLinkTo={navLinkTo}
    />
  );
};