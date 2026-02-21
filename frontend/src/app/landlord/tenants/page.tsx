'use client';
import type { TenantRouteParams } from '@/routes';
import { useRouteParams } from '@/routes/useRouteParams';
import { ViewAllTenants } from '@/components/landlord/ViewAllTenants';
import { ViewSingleTenant } from '@/components/landlord/ViewSingleTenant';

export default function TenantsPage() {
    const { id, action } = useRouteParams<TenantRouteParams>();

    return (
        action === 'new' ? <ViewSingleTenant /> :
            id ? <ViewSingleTenant id={id} /> :
                <ViewAllTenants />
    );
}
