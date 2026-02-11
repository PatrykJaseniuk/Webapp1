'use client';

import { useSearchParams } from 'next/navigation';

import { AppLayout } from '@/components/shared/AppLayout';
import { TenantsList } from '@/components/landlord/TenantsList';
import { TenantDetail } from '@/components/landlord/TenantDetail';
import { TenantForm } from '@/components/landlord/TenantForm';

export default () => {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const action = searchParams.get('action');

    return (
        action === 'new' ? <TenantForm /> :
            action === 'edit' && id ? <TenantForm id={id} /> :
                id ? <TenantDetail id={id} /> :
                    <TenantsList />
    );
};
