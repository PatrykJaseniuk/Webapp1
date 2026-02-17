'use client';

import { TENANT_STATUS_LABELS } from '@/constants/labels';
import { DataTable, ColumnDef } from '@/components/shared/DataTable';
import tableStyles from '@/components/shared/DataTable.module.css';
import { Database } from '@/api/database.types';

type Tenant = Database['public']['Tables']['tenants']['Row'];

interface TenantsListProps {
    tenants: Tenant[];
    onRowClick?: (id: string) => void;
}

const getStatusClass = (status: string | null | undefined): string => {
    if (!status) return '';
    const mapping: Record<string, string> = {
        active: tableStyles.statusActive,
        past: tableStyles.statusTerminated,
        applicant: tableStyles.statusPending,
    };
    return mapping[status] || '';
};

const columns: ColumnDef<Tenant>[] = [
    {
        key: 'name',
        label: 'Imie i nazwisko',
        render: (_value, row) => `${row.first_name} ${row.last_name}`,
    },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Telefon' },
    {
        key: 'status',
        label: 'Status',
        render: (value) => (
            <span className={`${tableStyles.statusBadge} ${getStatusClass(String(value))}`}>
                {TENANT_STATUS_LABELS[String(value) ?? ''] ?? value}
            </span>
        ),
    },
];

export const TenantsList = ({ tenants, onRowClick }: TenantsListProps) => {
    const handleRowClick = (tenant: Tenant) => {
        onRowClick?.(tenant.id);
    };

    return (
        <DataTable
            data={tenants}
            columns={columns}
            onRowClick={handleRowClick}
            emptyMessage="Brak najemców"
        />
    );
};
