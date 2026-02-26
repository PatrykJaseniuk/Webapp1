'use client';
import { database } from '@/api/database';
import { useNavigate } from '@/routes/useNavigate';
import { routes } from '@/routes';
import { ManyRecords } from '@/components/shared/ManyRecords';

export const ViewAllLeases = () => {
    const navigate = useNavigate();

    return (
        <ManyRecords
            query={() => database.from('lease_agreements').select('*,properties(*),transactions(*)', { count: 'exact' })}
            hiddenColumns={['created_by', 'updated_at', 'notes', 'tenant_id', 'property_id']}
            defaultSortKey="start_date"
            defaultSortDirection="desc"
            onRowClick={(row) => navigate(routes.landlord.leases({ id: row.id as string }))}
            onAdd={() => navigate(routes.landlord.leases({ action: 'new' }))}
        />
    );
};
