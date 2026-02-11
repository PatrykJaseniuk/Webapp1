'use client';

import { useSearchParams } from 'next/navigation';

import { AppLayout } from '@/components/shared/AppLayout';
import { BillingList } from '@/components/landlord/BillingList';
import { BillingForm } from '@/components/landlord/BillingForm';

export const BillingPage = () => {
    const searchParams = useSearchParams();
    const action = searchParams.get('action');

    return (
        <AppLayout>
            {action === 'new' ? <BillingForm /> : <BillingList />}
        </AppLayout>
    );
};
