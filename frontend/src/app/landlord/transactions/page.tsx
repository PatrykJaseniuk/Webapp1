'use client';
import type { TransactionRouteParams } from '@/routes';
import { useRouteParams } from '@/routes/useRouteParams';
import { ViewAllTransactions } from '@/components/landlord/ViewAllTransactions';
import { ViewSingleTransaction } from '@/components/landlord/ViewSingleTransaction';

export default function TransactionsPage() {
    const { id, action } = useRouteParams<TransactionRouteParams>();

    return (
        action === 'new' ? <ViewSingleTransaction /> :
            id ? <ViewSingleTransaction id={id} /> :
                <ViewAllTransactions />
    );
}
