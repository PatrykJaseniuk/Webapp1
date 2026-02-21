'use client';
import { database } from '@/api/database';
import { useNavigate } from '@/routes/useNavigate';
import { routes } from '@/routes';
import { ManyRecords } from '@/components/shared/ManyRecords';

export const ViewAllTenants = () => {
    const navigate = useNavigate();

    return (
        <ManyRecords
            tableName="tenants"
            query={() => database.from('tenants').select('*')}
            mode="cards"
            hiddenColumns={['created_by', 'updated_at', 'notes']}
            onRowClick={(row) => navigate(routes.landlord.tenants({ id: row.id as string }))}
            onAdd={() => navigate(routes.landlord.tenants({ action: 'new' }))}
        />
    );
};
