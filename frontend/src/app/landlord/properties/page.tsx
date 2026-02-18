'use client';

import type { PropertyRouteParams } from '@/routes';
import { useRouteParams } from '@/routes/useRouteParams';

import { AllPropertiesList } from '@/components/landlord/ViewAllProperties';
import { PropertySingle } from '@/components/landlord/ViewSingleProperty';

export default () => {
    const { id, action } = useRouteParams<PropertyRouteParams>();

    return (
        action === 'new' ? <PropertySingle /> :
            id ? <PropertySingle id={id} /> :
                <AllPropertiesList />
    );
};
