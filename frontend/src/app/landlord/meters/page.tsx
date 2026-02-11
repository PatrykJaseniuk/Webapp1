'use client';

import type { MeterRouteParams } from '@/routes';
import { useRouteParams } from '@/routes/useRouteParams';

import { MetersList } from '@/components/landlord/MetersList';
import { MeterForm } from '@/components/landlord/MeterForm';
import { ReadingForm } from '@/components/landlord/ReadingForm';
import { ReadingsHistory } from '@/components/landlord/ReadingsHistory';

export default () => {
    const { action, meterId } = useRouteParams<MeterRouteParams>();

    return (
        action === 'new-meter' ? <MeterForm /> :
            action === 'new-reading' ? <ReadingForm meterId={meterId} /> :
                meterId ? <ReadingsHistory meterId={meterId} /> :
                    <MetersList />
    );
};
