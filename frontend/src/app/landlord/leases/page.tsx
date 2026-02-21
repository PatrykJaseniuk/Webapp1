'use client';
import type { LeaseRouteParams } from '@/routes';
import { useRouteParams } from '@/routes/useRouteParams';
import { ViewAllLeases } from '@/components/landlord/ViewAllLeases';
import { ViewSingleLease } from '@/components/landlord/ViewSingleLease';

export default function LeasesPage() {
    const { id, action } = useRouteParams<LeaseRouteParams>();

    return (
        action === 'new' ? <ViewSingleLease /> :
            id ? <ViewSingleLease id={id} /> :
                <ViewAllLeases />
    );
}
