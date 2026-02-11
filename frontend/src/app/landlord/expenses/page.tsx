'use client';

import { useParams, useSearchParams } from 'next/navigation';

import { RoleGuard } from '@/components/shared/RoleGuard';
import { AppLayout } from '@/components/shared/AppLayout';
import { ExpensesList } from '@/components/landlord/ExpensesList';
import { ExpenseForm } from '@/components/landlord/ExpenseForm';




export default function Page() {
    const searchParams = useSearchParams();
    const action = searchParams.get('action');
    const params = useParams()
    

    return (
        action === 'new' ? <ExpenseForm /> : <ExpensesList />
    );
}
