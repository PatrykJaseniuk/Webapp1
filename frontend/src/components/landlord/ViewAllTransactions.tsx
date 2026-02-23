'use client';
import { database } from '@/api/database';
import { useNavigate } from '@/routes/useNavigate';
import { routes } from '@/routes';
import { ManyRecords } from '@/components/shared/ManyRecords';

export const ViewAllTransactions = () => {
    const navigate = useNavigate();

    return (
        <ManyRecords
            tableName="transactions"
            query={() => database.from('transactions').select('*')}
            hiddenColumns={['created_by', 'updated_at', 'lease_id', 'property_id']}
            defaultSortKey="due_date"
            defaultSortDirection="desc"
            onRowClick={(row) => navigate(routes.landlord.transactions({ id: row.id as string }))}
            onAdd={() => navigate(routes.landlord.transactions({ action: 'new' }))}
        />
    );
};
