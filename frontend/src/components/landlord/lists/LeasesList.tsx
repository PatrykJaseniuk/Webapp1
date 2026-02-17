'use client';

import { LEASE_STATUS_LABELS } from '@/constants/labels';
import { formatCurrency } from '@/utils/formatCurrency';
import { DataTable, ColumnDef, getStatusClass } from '@/components/shared/DataTable';
import tableStyles from '@/components/shared/DataTable.module.css';
import { Database } from '@/api/database.types';

type Lease = Database['public']['Tables']['lease_agreements']['Row'];

interface LeasesListProps {
    leases: Array<Lease & {
        tenants?: { first_name: string; last_name: string };
        properties?: { name: string };
    }>;
    onRowClick?: (id: string) => void;
}

const getLeaseStatusClass = (status: string | null | undefined): string => {
    if (!status) return '';
    const mapping: Record<string, string> = {
        active: tableStyles.statusActive,
        expired: tableStyles.statusExpired,
        terminated: tableStyles.statusTerminated,
    };
    return mapping[status] || '';
};

const columns: ColumnDef<Lease>[] = [
    {
        key: 'properties.name',
        label: 'Nieruchomość',
        render: (_value, row) => (row as any).properties?.name ?? row.property_id,
    },
    {
        key: 'tenants',
        label: 'Najemca',
        render: (_value, row) => {
            const tenants = (row as any).tenants;
            return tenants ? `${tenants.first_name} ${tenants.last_name}` : row.tenant_id;
        },
    },
    {
        key: 'period',
        label: 'Okres',
        render: (_value, row) => `${row.start_date} — ${row.end_date ?? 'Bezterminowa'}`,
    },
    {
        key: 'monthly_rent',
        label: 'Czynsz',
        render: (value) => formatCurrency(Number(value) || 0),
    },
    {
        key: 'status',
        label: 'Status',
        render: (value) => (
            <span className={`${tableStyles.statusBadge} ${getLeaseStatusClass(String(value))}`}>
                {LEASE_STATUS_LABELS[String(value) ?? ''] ?? value}
            </span>
        ),
    },
];

export const LeasesList = ({ leases, onRowClick }: LeasesListProps) => {
    const handleRowClick = (lease: Lease) => {
        onRowClick?.(lease.id);
    };

    return (
        <DataTable
            data={leases}
            columns={columns}
            onRowClick={handleRowClick}
            emptyMessage="Brak umów najmu"
        />
    );
};
