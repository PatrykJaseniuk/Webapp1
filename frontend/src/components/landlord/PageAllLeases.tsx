'use client';
import { database } from '@/api/database';
import { routes } from '@/api/routes/appRoutes';
import { ManyRecords } from '@/components/core/ManyRecords';
import { useRouter } from 'next/navigation';

export const ViewAllLeases = () => {
    const router = useRouter()

    return (
        <ManyRecords
            query={() => database.from('lease_agreements').select('*,properties(*),tenants(*),transactions(*)', { count: 'exact' })}
            hiddenColumns={['created_by', 'updated_at', 'notes', 'tenant_id', 'property_id']}
            defaultSortKey="start_date"
            defaultSortDirection="desc"
            onRowClick={(row) => router.push(routes.landlord.leases({ id: row.id as string }))}
        // onAdd={() => router.push(routes.landlord.leases({ action: 'new' }))}
        />
    );
};
