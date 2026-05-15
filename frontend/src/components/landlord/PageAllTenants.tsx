'use client';
import { database } from '@/api/database';
import { routes } from '@/api/routes/appRoutes';
import { ManyRecords } from '@/components/coreComponents/ManyRecords';
import { useRouter } from 'next/navigation';

export const ViewAllTenants = () => {
    const router = useRouter();

    return (
        <ManyRecords
            query={() => database.from('tenants').select('*')}
            hiddenColumns={['created_by', 'updated_at', 'notes']}
            onRowClick={(row) => router.push(routes.landlord.tenants({ id: row.id as string }))}
        // onAdd={() => router.push(routes.landlord.tenants({ action: 'new' }))}
        />
    );
};
