'use client';

import { useSearchParams } from 'next/navigation';

import { AppLayout } from '@/components/shared/AppLayout';
import { PaymentsList } from '@/components/landlord/PaymentsList';
import { PaymentForm } from '@/components/landlord/PaymentForm';

export const PaymentsPage = () => {
    const searchParams = useSearchParams();
    const action = searchParams.get('action');

    return (
        <AppLayout>
            {action === 'new' ? <PaymentForm /> : <PaymentsList />}
        </AppLayout>
    );
};
