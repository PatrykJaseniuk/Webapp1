'use client';

import { TRANSACTION_STATUS_LABELS } from '@/constants/labels';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { DataTable, ColumnDef } from '@/components/shared/DataTable';
import tableStyles from '@/components/shared/DataTable.module.css';
import { Database } from '@/api/database.types';

type Transaction = Database['public']['Tables']['transactions']['Row'];

interface TransactionsListProps {
    transactions: Transaction[];
    onRowClick?: (id: string) => void;
}

const getStatusClass = (status: string | null | undefined): string => {
    const mapping: Record<string, string> = {
        paid: tableStyles.statusActive,
        pending: tableStyles.statusPending,
        overdue: tableStyles.statusTerminated,
    };
    return status ? mapping[status] || '' : '';
};

const getAmountClass = (amount: number | null | undefined): string => {
    return (amount ?? 0) >= 0 ? tableStyles.positive : tableStyles.negative;
};

const columns: ColumnDef<Transaction>[] = [
    {
        key: 'due_date',
        label: 'Data',
        render: (value) => value ? formatDate(String(value)) : '—',
    },
    {
        key: 'type',
        label: 'Typ',
        render: (value) => {
            const labels: Record<string, string> = {
                rent: 'Czynsz',
                utility: 'Media',
                expense: 'Wydatek',
                payment: 'Płatność',
                withdraw: 'Wypłata',
                fee: 'Opłata',
                other: 'Inne',
            };
            return labels[String(value) ?? ''] ?? value;
        },
    },
    {
        key: 'description',
        label: 'Opis',
    },
    {
        key: 'amount',
        label: 'Kwota',
        render: (value) => (
            <span className={getAmountClass(Number(value))}>
                {formatCurrency(Number(value) || 0)}
            </span>
        ),
    },
    {
        key: 'status',
        label: 'Status',
        render: (value) => (
            <span className={`${tableStyles.statusBadge} ${getStatusClass(String(value))}`}>
                {TRANSACTION_STATUS_LABELS[String(value) ?? ''] ?? value}
            </span>
        ),
    },
];

export const TransactionsList = ({ transactions, onRowClick }: TransactionsListProps) => {
    const handleRowClick = (transaction: Transaction) => {
        onRowClick?.(transaction.id);
    };

    return (
        <DataTable
            data={transactions}
            columns={columns}
            onRowClick={handleRowClick}
            emptyMessage="Brak transakcji"
        />
    );
};
