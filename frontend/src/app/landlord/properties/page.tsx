'use client';
import type { PropertyRouteParams } from '@/routes';
import { useRouteParams } from '@/routes/useRouteParams';
import { ViewAllProperties } from '@/components/landlord/ViewAllProperties';
import { ViewSingleProperty } from '@/components/landlord/ViewSingleProperty';
import { useState } from 'react';
import { database } from '@/api/database';

export default function PropertiesPage() {
    const { id, action } = useRouteParams<PropertyRouteParams>();

    useState(() => {
        database.from('properties').select('*, lease_agreements(*,tenants(*))').then((res) => console.log(res))
    })
    return (
        action === 'new' ? <ViewSingleProperty /> :
            id ? <ViewSingleProperty id={id} /> :
                <ViewAllProperties />
    );
}
