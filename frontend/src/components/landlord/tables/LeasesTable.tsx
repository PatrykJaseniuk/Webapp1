'use client';

import type { Database } from '@/api/database.types';
import { LEASE_STATUS_LABELS } from '@/constants/labels';
import { formatCurrency } from '@/utils/formatCurrency';
import styles from './Tables.module.css';

type Lease = Database['public']['Tables']['lease_agreements']['Row'];
type Tenant = Database['public']['Tables']['tenants']['Row'];

interface LeaseWithTenant extends Lease {
    tenants: Pick<Tenant, 'first_name' | 'last_name'> | null;
}

interface LeasesTableProps {
    data: LeaseWithTenant[];
    onRowClick?: (id: string) => void;
}

const getStatusClass = (status: string) =>
    status === 'active' ? styles.statusActive :
        status === 'expired' ? styles.statusExpired :
            styles.statusTerminated;

export const LeasesTable = ({ data, onRowClick }: LeasesTableProps) => (
    <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Historia umów ({data.length})</h2>

        {data.length === 0
            ? <div className={styles.emptyState}>Brak umów dla tej nieruchomości</div>
            : (
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Najemca</th>
                            <th>Okres</th>
                            <th>Czynsz</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map(lease => (
                            <tr
                                key={lease.id}
                                className={onRowClick ? styles.clickableRow : ''}
                                onClick={() => onRowClick?.(lease.id)}
                            >
                                <td>
                                    {lease.tenants
                                        ? `${lease.tenants.first_name} ${lease.tenants.last_name}`
                                        : '—'
                                    }
                                </td>
                                <td>
                                    {lease.start_date} — {lease.end_date ?? 'Bezterminowa'}
                                </td>
                                <td>{formatCurrency(lease.monthly_rent)}</td>
                                <td>
                                    <span className={`${styles.statusBadge} ${getStatusClass(lease.status)}`}>
                                        {LEASE_STATUS_LABELS[lease.status] ?? lease.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )
        }
    </div>
);
