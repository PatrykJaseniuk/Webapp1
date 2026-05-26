'use client';
import type { PropertyRouteParams } from '@/api/routes/appRoutes';
import { useRouteParams } from '@/api/routes/useRouteParams';
import { ViewAllProperties } from '@/components/landlord/PageAllProperties';
import { PageCreateProperty } from '@/components/landlord/PageCreateProperty';
import { PageSingleProperty } from '@/components/landlord/PageSingleProperty';

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
