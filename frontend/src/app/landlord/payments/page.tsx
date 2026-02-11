'use client';

import type { PaymentRouteParams } from '@/routes';
import { useRouteParams } from '@/routes/useRouteParams';

import { PaymentsList } from '@/components/landlord/PaymentsList';
import { PaymentForm } from '@/components/landlord/PaymentForm';

export default () => {
    const { action } = useRouteParams<PaymentRouteParams>();

    return (
        action === 'new' ? <PaymentForm /> : <PaymentsList />
    );
};
