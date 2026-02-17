'use client';

import type { TransactionRouteParams } from '@/routes';
import { useRouteParams } from '@/routes/useRouteParams';

import { AllTransactionsList } from '@/components/landlord/AllTransactionsList';
import { TransactionSingle } from '@/components/landlord/TransactionSingle';

export default () => {
    const { action, id } = useRouteParams<TransactionRouteParams>();

    return (
        action === 'new' ? <TransactionSingle /> :
            id ? <TransactionSingle id={id} /> :
                <AllTransactionsList />
    );
};
