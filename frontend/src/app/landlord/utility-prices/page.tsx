'use client';

import type { UtilityPriceRouteParams } from '@/routes';
import { useRouteParams } from '@/routes/useRouteParams';

import { UtilityPricesList } from '@/components/landlord/UtilityPricesList';
import { UtilityPriceForm } from '@/components/landlord/UtilityPriceForm';

export default function Page() {
    const { action } = useRouteParams<UtilityPriceRouteParams>();

    return (
        action === 'new' ? <UtilityPriceForm /> : <UtilityPricesList />
    );
}
