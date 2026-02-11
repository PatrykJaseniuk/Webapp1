'use client';

import { useSearchParams } from 'next/navigation';

import { RoleGuard } from '@/components/shared/RoleGuard';
import { AppLayout } from '@/components/shared/AppLayout';
import { ExpensesList } from '@/components/landlord/ExpensesList';
import { ExpenseForm } from '@/components/landlord/ExpenseForm';

export default function Page() {
    const searchParams = useSearchParams();
    const action = searchParams.get('action');

    return (
        <RoleGuard allowedRoles={['landlord', 'admin']}>
            <AppLayout>
                {action === 'new' ? <ExpenseForm /> : <ExpensesList />}
            </AppLayout>
        </RoleGuard>
    );
}
