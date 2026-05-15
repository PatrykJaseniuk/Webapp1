'use client';
import type { PropertyRouteParams } from '@/api/routes/appRoutes';
import { useRouteParams } from '@/api/routes/useRouteParams';
import { ViewAllProperties } from '@/components/landlord/PageAllProperties';
import { PageSingleProperty } from '@/components/landlord/PageSingleProperty';
import { PageCreateProperty } from '@/components/landlord/PageCreateProperty';

export default function PropertiesPage() {
    const { id, action } = useRouteParams<PropertyRouteParams>();

    return (
        action === 'new' ?
            <PageCreateProperty /> :
            id ?
                <PageSingleProperty id={id} /> :
                <ViewAllProperties />
    );
}
