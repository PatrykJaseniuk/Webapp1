'use client';

import type { LeaseRouteParams } from '@/routes';
import { useRouteParams } from '@/routes/useRouteParams';

import { AllLeasesList } from '@/components/landlord/ViewAllLeases';
import { LeaseSingle } from '@/components/landlord/ViewSingleLease';

export default () => {
    const { id, action } = useRouteParams<LeaseRouteParams>();

    return (
        action === 'new' ? <LeaseSingle /> :
            id ? <LeaseSingle id={id} /> :
                <AllLeasesList />
    );
};
