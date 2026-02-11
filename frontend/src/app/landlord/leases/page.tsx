'use client';

import type { LeaseRouteParams } from '@/routes';
import { useRouteParams } from '@/routes/useRouteParams';

import { LeasesList } from '@/components/landlord/LeasesList';
import { LeaseDetail } from '@/components/landlord/LeaseDetail';
import { LeaseForm } from '@/components/landlord/LeaseForm';

export default () => {
    const { id, action } = useRouteParams<LeaseRouteParams>();

    return (
        action === 'new' ? <LeaseForm /> :
            action === 'edit' && id ? <LeaseForm id={id} /> :
                id ? <LeaseDetail id={id} /> :
                    <LeasesList />
    );
};
