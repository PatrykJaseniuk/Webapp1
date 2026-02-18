'use client';

import type { TransactionRouteParams } from '@/routes';
import { useRouteParams } from '@/routes/useRouteParams';

import { ViewAllTransactions } from '@/components/landlord/ViewAllTransactions';
import { TransactionSingle } from '@/components/landlord/ViewSingleTransaction';

export default () => {
    const { action, id } = useRouteParams<TransactionRouteParams>();

    return (
        action === 'new' ? <TransactionSingle /> :
            id ? <TransactionSingle id={id} /> :
                <ViewAllTransactions />
    );
};
