'use client';
import type { PropertyRouteParams } from '@/routes';
import { useRouteParams } from '@/routes/useRouteParams';
import { ViewAllProperties } from '@/components/landlord/ViewAllProperties';
import { ViewSingleProperty } from '@/components/landlord/ViewSingleProperty';

export default function PropertiesPage() {
    const { id, action } = useRouteParams<PropertyRouteParams>();

    return (
        action === 'new' ? <ViewSingleProperty /> :
        id ? <ViewSingleProperty id={id} /> :
        <ViewAllProperties />
    );
}
