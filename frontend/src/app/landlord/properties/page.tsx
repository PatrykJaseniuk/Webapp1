'use client';

import { useSearchParams } from 'next/navigation';

import { AppLayout } from '@/components/shared/AppLayout';
import { PropertiesList } from '@/components/landlord/PropertiesList';
import { PropertyDetail } from '@/components/landlord/PropertyDetail';
import { PropertyForm } from '@/components/landlord/PropertyForm';

export default () => {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const action = searchParams.get('action');

    return (
        action === 'new' ? <PropertyForm /> :
            action === 'edit' && id ? <PropertyForm id={id} /> :
                id ? <PropertyDetail id={id} /> :
                    <PropertiesList />
    );
};
