'use client';

import { PROPERTY_STATUS_LABELS, PROPERTY_TYPE_LABELS } from '@/constants/labels';
import { formatCurrency } from '@/utils/formatCurrency';
import { DataTable, ColumnDef } from '@/components/shared/DataTable';
import tableStyles from '@/components/shared/DataTable.module.css';
import { Database } from '@/api/database.types';

type Property = Database['public']['Tables']['properties']['Row'];

interface PropertiesListProps {
    properties: Property[];
    onRowClick?: (id: string) => void;
}

const getStatusClass = (status: string | null | undefined): string => {
    if (!status) return '';
    const mapping: Record<string, string> = {
        available: tableStyles.statusActive,
        occupied: tableStyles.statusPending,
        inactive: tableStyles.statusTerminated,
    };
    return mapping[status] || '';
};

const columns: ColumnDef<Property>[] = [
    { key: 'name', label: 'Nazwa' },
    { key: 'address', label: 'Adres' },
    {
        key: 'property_type',
        label: 'Typ',
        render: (value) => PROPERTY_TYPE_LABELS[String(value) ?? ''] ?? value,
    },
    {
        key: 'status',
        label: 'Status',
        render: (value) => (
            <span className={`${tableStyles.statusBadge} ${getStatusClass(String(value))}`}>
                {PROPERTY_STATUS_LABELS[String(value) ?? ''] ?? value}
            </span>
        ),
    },
    {
        key: 'monthly_rent',
        label: 'Czynsz',
        render: (value) => formatCurrency(Number(value) || 0),
    },
];

export const PropertiesList = ({ properties, onRowClick }: PropertiesListProps) => {
    const handleRowClick = (property: Property) => {
        onRowClick?.(property.id);
    };

    return (
        <DataTable
            data={properties}
            columns={columns}
            onRowClick={handleRowClick}
            emptyMessage="Brak nieruchomości"
        />
    );
};
