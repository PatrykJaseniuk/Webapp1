'use client';
import { database } from '@/api/database';
import { routes } from '@/routes';
import { ManyRecords } from '@/components/coreComponents/ManyRecords';
import styles from '@/components/styles/viewAll.module.css';
import { useRouter } from 'next/navigation';

export default function LandlordDashboard() {
    const router = useRouter();

    return (
        <div className={styles.viewAllContainer}>
            <h1 className={styles.viewAllTitle}>Panel wynajmującego</h1>

            <ManyRecords
                label="Nieruchomości"
                query={() => database.from('properties').select('*')}
                hiddenColumns={['created_by', 'updated_at', 'notes', 'created_at']}
                onRowClick={(row) => router.push(routes.landlord.properties({ id: row.id as string }))}
                pageSize={6}
            />

            <ManyRecords
                label="Ostatnie umowy"
                query={() => database.from('lease_agreements').select('tenants(*), properties(*), *')}
                hiddenColumns={['created_by', 'updated_at', 'notes', 'id', 'tenant_id', 'property_id']}
                defaultSortKey="created_at"
                defaultSortDirection="desc"
                onRowClick={(row) => router.push(routes.landlord.leases({ id: row.id as string }))}
                pageSize={5}
            />
        </div>
    );
}
