'use client';
import { database } from '@/api/database';
import { routes } from '@/routes';
import { ManyRecords } from '@/components/coreComponents/ManyRecords';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const ViewAllTransactions = () => {
    const router = useRouter();

    useEffect(() => {
        const res = database.from('transactions').select('*', { count: 'exact' })
    })

    return (
        <ManyRecords
            query={() => database.from('transactions').select('*,properties(*)', { count: 'exact' })}
            hiddenColumns={['created_by', 'updated_at', 'lease_id', 'property_id']}
            defaultSortKey="due_date"
            defaultSortDirection="desc"
            onRowClick={(row) => router.push(routes.landlord.transactions({ id: row.id as string }))}
            onAdd={() => router.push(routes.landlord.transactions({ action: 'new' }))}
        />
    );
};
