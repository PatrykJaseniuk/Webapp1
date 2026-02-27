'use client';

import { routes } from '@/routes';
import { useNavigate } from '@/routes/useNavigate';
import { SingleRecordDetails } from '@/components/coreComponents/SingleRecordDetails';
import { ManyRecords } from '@/components/coreComponents/ManyRecords';
import { database } from '@/api/database';
import styles from '@/components/styles/viewSingle.module.css';

interface ViewSingleTenantProps {
    id?: string;
}

export const ViewSingleTenant = ({ id }: ViewSingleTenantProps) => {
    const navigate = useNavigate();
    const isCreateMode = !id;

    return (
        <div className={styles.viewSingleContainer}>
            <SingleRecordDetails
                id={id}
                tableName="tenants"
                select='*,lease_agreements(*)'
                hiddenColumns={['id', 'user_id', 'created_by', 'updated_at']}
                label="Najemca"
                onSave={(record) => navigate(routes.landlord.tenants({ id: record.id as string }))}
                onDelete={() => navigate(routes.landlord.tenants())}
            />

            <ManyRecords
                label="Umowy najmu"
                query={() => database.from('lease_agreements').select('*').eq('tenant_id', id!)}
                hiddenColumns={['id', 'tenant_id', 'created_by', 'updated_at', 'notes']}
                onRowClick={(row) => navigate(routes.landlord.leases({ id: row.id as string }))}
                disabled={isCreateMode}
                disabledMessage="Zapisz najemcę, aby zobaczyć umowy"
            />
        </div>
    );
};