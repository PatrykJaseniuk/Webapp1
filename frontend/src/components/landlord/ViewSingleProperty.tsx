'use client';

import { routes } from '@/routes';
import { useNavigate } from '@/routes/useNavigate';
import { SingleRecordDetails } from '@/components/coreComponents/SingleRecordDetails';
import { ManyRecords } from '@/components/coreComponents/ManyRecords';
import { database } from '@/api/database';
import styles from '@/components/styles/viewSingle.module.css';

interface ViewSinglePropertyProps {
    id?: string;
}

export const ViewSingleProperty = ({ id }: ViewSinglePropertyProps) => {
    const navigate = useNavigate();
    const isCreateMode = !id;

    return (
        <div className={styles.viewSingleContainer}>
            <SingleRecordDetails
                id={id}
                tableName="properties"
                hiddenColumns={['id', 'created_by', 'updated_at']}
                label="Nieruchomość"
                onSave={(record) => navigate(routes.landlord.properties({ id: record.id as string }))}
                onDelete={() => navigate(routes.landlord.properties())}
            />

            <ManyRecords
                label="Umowy najmu"
                query={() => database.from('lease_agreements').select('*').eq('property_id', id!)}
                hiddenColumns={['id', 'property_id', 'created_by', 'updated_at', 'notes']}
                onRowClick={(row) => navigate(routes.landlord.leases({ id: row.id as string }))}
                disabled={isCreateMode}
                disabledMessage="Zapisz nieruchomość, aby dodać umowy"
            />

            <ManyRecords
                label="Transakcje"
                query={() => database.from('transactions').select('*').eq('property_id', id!)}
                hiddenColumns={['id', 'property_id', 'lease_id', 'created_by', 'updated_at']}
                defaultSortKey="due_date"
                defaultSortDirection="desc"
                onRowClick={(row) => navigate(routes.landlord.transactions({ id: row.id as string }))}
                disabled={isCreateMode}
                disabledMessage="Zapisz nieruchomość, aby dodać transakcje"
            />
        </div>
    );
};