'use client';

import type { TenantRouteParams } from '@/routes';
import { useRouteParams } from '@/routes/useRouteParams';

import { AllTenantsList } from '@/components/landlord/AllTenantsList';
import { TenantSingle } from '@/components/landlord/TenantSingle';

export default () => {
    const { id, action } = useRouteParams<TenantRouteParams>();

    return (
        action === 'new' ? <TenantSingle /> :
            id ? <TenantSingle id={id} /> :
                <AllTenantsList />
    );
};
