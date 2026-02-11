'use client';

import { useSearchParams } from 'next/navigation';

import { RoleGuard } from '@/components/shared/RoleGuard';
import { AppLayout } from '@/components/shared/AppLayout';
import { UtilityPricesList } from '@/components/landlord/UtilityPricesList';
import { UtilityPriceForm } from '@/components/landlord/UtilityPriceForm';

export default function Page() {
    const searchParams = useSearchParams();
    const action = searchParams.get('action');

    return (
        <RoleGuard allowedRoles={['landlord', 'admin']}>
            <AppLayout>
                {action === 'new' ? <UtilityPriceForm /> : <UtilityPricesList />}
            </AppLayout>
        </RoleGuard>
    );
}
