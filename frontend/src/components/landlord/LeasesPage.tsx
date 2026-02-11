'use client';

import { useSearchParams } from 'next/navigation';

import { AppLayout } from '@/components/shared/AppLayout';
import { LeasesList } from '@/components/landlord/LeasesList';
import { LeaseDetail } from '@/components/landlord/LeaseDetail';
import { LeaseForm } from '@/components/landlord/LeaseForm';

export const LeasesPage = () => {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const action = searchParams.get('action');

    return (
        <AppLayout>
            {action === 'new' ? <LeaseForm /> :
                action === 'edit' && id ? <LeaseForm id={id} /> :
                    id ? <LeaseDetail id={id} /> :
                        <LeasesList />}
        </AppLayout>
    );
};
