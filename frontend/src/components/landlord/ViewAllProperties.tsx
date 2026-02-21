'use client';
import { database } from '@/api/database';
import { useNavigate } from '@/routes/useNavigate';
import { routes } from '@/routes';
import { ManyRecords } from '@/components/shared/ManyRecords';

export const ViewAllProperties = () => {
    const navigate = useNavigate();

    return (
        <ManyRecords
            tableName="properties"
            query={() => database.from('properties').select('*')}
            mode="cards"
            hiddenColumns={['created_by', 'updated_at', 'notes']}
            onRowClick={(row) => navigate(routes.landlord.properties({ id: row.id as string }))}
            onAdd={() => navigate(routes.landlord.properties({ action: 'new' }))}
        />
    );
};
