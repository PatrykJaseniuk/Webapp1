'use client';

import type { TenantRouteParams } from '@/routes';
import { useRouteParams } from '@/routes/useRouteParams';

import { TenantsList } from '@/components/landlord/TenantsList';
import { TenantDetail } from '@/components/landlord/TenantDetail';
import { TenantForm } from '@/components/landlord/TenantForm';

export default () => {
    const { id, action } = useRouteParams<TenantRouteParams>();

    return (
        action === 'new' ? <TenantForm /> :
            action === 'edit' && id ? <TenantForm id={id} /> :
                id ? <TenantDetail id={id} /> :
                    <TenantsList />
    );
};
