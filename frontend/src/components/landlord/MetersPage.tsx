'use client';

import { useSearchParams } from 'next/navigation';

import { AppLayout } from '@/components/shared/AppLayout';
import { MetersList } from '@/components/landlord/MetersList';
import { MeterForm } from '@/components/landlord/MeterForm';
import { ReadingForm } from '@/components/landlord/ReadingForm';
import { ReadingsHistory } from '@/components/landlord/ReadingsHistory';

export const MetersPage = () => {
    const searchParams = useSearchParams();
    const action = searchParams.get('action');
    const meterId = searchParams.get('meterId');

    return (
        <AppLayout>
            {action === 'new-meter' ? <MeterForm /> :
                action === 'new-reading' ? <ReadingForm meterId={meterId ?? undefined} /> :
                    meterId ? <ReadingsHistory meterId={meterId} /> :
                        <MetersList />}
        </AppLayout>
    );
};
