'use client';

import { useSearchParams } from 'next/navigation';

import { AppLayout } from '@/components/shared/AppLayout';
import { TenantsList } from '@/components/landlord/TenantsList';
import { TenantDetail } from '@/components/landlord/TenantDetail';
import { TenantForm } from '@/components/landlord/TenantForm';

export const TenantsPage = () => {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const action = searchParams.get('action');

    return (
        <AppLayout>
            {action === 'new' ? <TenantForm /> :
                action === 'edit' && id ? <TenantForm id={id} /> :
                    id ? <TenantDetail id={id} /> :
                        <TenantsList />}
        </AppLayout>
    );
};
