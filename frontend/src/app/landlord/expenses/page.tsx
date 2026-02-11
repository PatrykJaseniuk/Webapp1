'use client';

import type { ExpenseRouteParams } from '@/routes';
import { useRouteParams } from '@/routes/useRouteParams';

import { ExpensesList } from '@/components/landlord/ExpensesList';
import { ExpenseForm } from '@/components/landlord/ExpenseForm';

export default function Page() {
    const { action } = useRouteParams<ExpenseRouteParams>();

    return (
        action === 'new' ? <ExpenseForm /> : <ExpensesList />
    );
}
