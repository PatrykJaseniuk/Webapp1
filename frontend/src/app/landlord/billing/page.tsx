'use client';

import type { BillingRouteParams } from '@/routes';
import { useRouteParams } from '@/routes/useRouteParams';

import { BillingList } from '@/components/landlord/BillingList';
import { BillingForm } from '@/components/landlord/BillingForm';

export default function Page() {
    const { action } = useRouteParams<BillingRouteParams>();

    return (
        action === 'new' ? <BillingForm /> : <BillingList />
    );
}
