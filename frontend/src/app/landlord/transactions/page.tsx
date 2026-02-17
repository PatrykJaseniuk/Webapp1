'use client';

import type { TransactionRouteParams } from '@/routes';
import { useRouteParams } from '@/routes/useRouteParams';

import { TransactionList } from '@/components/landlord/PaymentsList';
import { TransactionForm } from '@/components/landlord/PaymentForm';

export default () => {
    const { action } = useRouteParams<TransactionRouteParams>();

    return (
        action === 'new' ? <TransactionForm /> : <TransactionList />
    );
};
