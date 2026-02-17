'use client';

import type { PropertyRouteParams } from '@/routes';
import { useRouteParams } from '@/routes/useRouteParams';

import { AllPropertiesList } from '@/components/landlord/AllPropertiesList';
import { PropertySingle } from '@/components/landlord/PropertySingle';

export default () => {
    const { id, action } = useRouteParams<PropertyRouteParams>();

    return (
        action === 'new' ? <PropertySingle /> :
            id ? <PropertySingle id={id} /> :
                <AllPropertiesList />
    );
};
