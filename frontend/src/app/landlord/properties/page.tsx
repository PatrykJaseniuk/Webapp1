'use client';

import type { PropertyRouteParams } from '@/routes';
import { useRouteParams } from '@/routes/useRouteParams';

import { PropertiesList } from '@/components/landlord/PropertiesList';
import { PropertyDetail } from '@/components/landlord/PropertyDetail';
import { PropertyForm } from '@/components/landlord/PropertyForm';

export default () => {
    const { id, action } = useRouteParams<PropertyRouteParams>();

    return (
        action === 'new' ? <PropertyForm /> :
            action === 'edit' && id ? <PropertyForm id={id} /> :
                id ? <PropertyDetail id={id} /> :
                    <PropertiesList />
    );
};
