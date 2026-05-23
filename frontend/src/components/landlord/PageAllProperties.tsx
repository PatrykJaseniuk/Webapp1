'use client';
import { database } from '@/api/database';
import { routes } from '@/api/routes/appRoutes';
import { ManyRecords } from '@/components/coreComponents/ManyRecords';
import { useRouter } from 'next/navigation';

export const ViewAllProperties = () => {
    const router = useRouter();
    return (
        <ManyRecords
            query={() => database.from('properties').select('id,  address, name, property_status, lease_agreements(*)')}
            // hiddenColumns={['created_by', 'updated_at', 'notes']}
            onRowClick={(row) => router.push(routes.landlord.properties({ id: row.id as string }))}
        />
    );
};
