'use client';
import React, { use } from 'react';
import type { Database } from '@/api/database.types';
import { formatDate, formatDateTime } from '@/utils/formatDate';
import { formatCurrency } from '@/utils/formatCurrency';
import { database } from '@/api/database';
import { useAsync } from 'react-use';
import Link from 'next/link';
import { routes } from '@/routes';

// ── Type utilities ──────────────────────────────────────────────────

type TableName = keyof Database['public']['Tables'];
type ViewName = keyof Database['public']['Views'];
type ColumnName<T extends TableName> = keyof Database['public']['Tables'][T]['Row'] & string;

export interface ColumnConfig {
    label?: string;
    render?: (value: unknown) => React.ReactNode;
    input?: (value: unknown, onChange: (v: unknown) => void) => React.ReactNode;
    hidden?: boolean;
    readonly?: boolean;
    required?: boolean;
    validate?: (value: unknown) => string | null;
}

type TableColumnRegistry<T extends TableName> = Partial<Record<ColumnName<T>, ColumnConfig>>;
type GlobalColumnRegistry = Record<string, ColumnConfig>;

type ColumnRegistryType = {
    _global: GlobalColumnRegistry;
} & {
    [T in TableName]?: TableColumnRegistry<T>;
} & {
    [V in ViewName]?: Record<string, ColumnConfig>;
};

// ── Renderers ───────────────────────────────────────────────────────

const renderBoolean = (value: unknown): React.ReactNode =>
    value === true ? 'Tak' : value === false ? 'Nie' : '—';

const PROPERTY_TYPE_LABELS: Record<string, string> = {
    apartment: 'Mieszkanie',
    house: 'Dom',
    commercial: 'Lokal usługowy',
    garage: 'Garaż',
    land: 'Działka',
    other: 'Inne',
};

const renderPropertyType = (value: unknown): React.ReactNode =>
    typeof value === 'string' ? (PROPERTY_TYPE_LABELS[value] ?? value) : '—';

const PROPERTY_STATUS_LABELS: Record<string, string> = {
    available: 'Dostępna',
    rented: 'Wynajęta',
    maintenance: 'W remoncie',
    inactive: 'Nieaktywna',
};

const renderPropertyStatus = (value: unknown): React.ReactNode =>
    typeof value === 'string' ?
        (PROPERTY_STATUS_LABELS[value] ?? value)
        : '—';

const TENANT_STATUS_LABELS: Record<string, string> = {
    active: 'Aktywny',
    inactive: 'Nieaktywny',
    pending: 'Oczekujący',
};

const renderTenantStatus = (value: unknown): React.ReactNode =>
    typeof value === 'string' ? (TENANT_STATUS_LABELS[value] ?? value) : '—';

const LEASE_STATUS_LABELS: Record<string, string> = {
    active: 'Aktywna',
    expired: 'Wygasła',
    terminated: 'Rozwiązana',
    draft: 'Szkic',
};

const renderLeaseStatus = (value: unknown): React.ReactNode =>
    typeof value === 'string' ? (LEASE_STATUS_LABELS[value] ?? value) : '—';

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
    rent: 'Czynsz',
    deposit: 'Kaucja',
    utility: 'Media',
    maintenance: 'Konserwacja',
    other: 'Inne',
};

const renderTransactionType = (value: unknown): React.ReactNode =>
    typeof value === 'string' ? (TRANSACTION_TYPE_LABELS[value] ?? value) : '—';

const TRANSACTION_STATUS_LABELS: Record<string, string> = {
    pending: 'Oczekująca',
    paid: 'Opłacona',
    overdue: 'Zaległa',
    cancelled: 'Anulowana',
};

const renderTransactionStatus = (value: unknown): React.ReactNode =>
    typeof value === 'string' ? (TRANSACTION_STATUS_LABELS[value] ?? value) : '—';

const FILE_TYPE_LABELS: Record<string, string> = {
    pdf: 'PDF',
    image: 'Obraz',
    document: 'Dokument',
    spreadsheet: 'Arkusz',
    other: 'Inny',
};

const renderFileType = (value: unknown): React.ReactNode =>
    typeof value === 'string' ? (FILE_TYPE_LABELS[value] ?? value) : '—';

const formatFileSize = (value: unknown): React.ReactNode => {
    const num = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
    return isNaN(num)
        ? '—'
        : num < 1024
            ? `${num} B`
            : num < 1024 * 1024
                ? `${(num / 1024).toFixed(1)} KB`
                : `${(num / (1024 * 1024)).toFixed(1)} MB`;
};

const renderLeaseProperty = (value: unknown): React.ReactNode =>
    typeof value === 'string' ? <Reference id={value} /> : '—';

const Reference: React.FC<{ id: string }> = ({ id }) => {
    const state = useAsync(async () => {
        return await database.from('properties').select('name, id').eq('id', id).single();
    }, [id]);


    return <span>{
        <Link href={routes.landlord.properties({ id: state.value?.data?.id })} className="text-blue-600 hover:underline">
            {state.value?.data?.name ?? 'Ładowanie...'}
        </Link>
    }</span>;
};
// ── Input helpers ───────────────────────────────────────────────────

const textareaInput = (value: unknown, onChange: (v: unknown) => void): React.ReactNode => (
    <textarea
        value={(value as string) ?? ''}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
    />
);

const currencyInput = (value: unknown, onChange: (v: unknown) => void): React.ReactNode => (
    <input
        type="number"
        step="0.01"
        min="0"
        value={(value as number) ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
    />
);

const dateInput = (value: unknown, onChange: (v: unknown) => void): React.ReactNode => (
    <input
        type="date"
        value={(value as string) ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
    />
);

const selectInput =
    (options: Record<string, string>) =>
        (value: unknown, onChange: (v: unknown) => void): React.ReactNode => (
            <select value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)}>
                <option value="">— Wybierz —</option>
                {Object.entries(options).map(([k, v]) => (
                    <option key={k} value={k}>
                        {v}
                    </option>
                ))}
            </select>
        );

const selectPropertyType = selectInput(PROPERTY_TYPE_LABELS);
const selectPropertyStatus = selectInput(PROPERTY_STATUS_LABELS);
const selectTenantStatus = selectInput(TENANT_STATUS_LABELS);
const selectLeaseStatus = selectInput(LEASE_STATUS_LABELS);
const selectTransactionType = selectInput(TRANSACTION_TYPE_LABELS);
const selectTransactionStatus = selectInput(TRANSACTION_STATUS_LABELS);

// ── Validation helpers ──────────────────────────────────────────────

const validateEmail = (value: unknown): string | null =>
    typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        ? null
        : 'Nieprawidłowy adres email';

// ── Registry ────────────────────────────────────────────────────────

export const COLUMN_REGISTRY: ColumnRegistryType = {
    _global: {
        id: { label: 'ID', hidden: true, readonly: true },
        created_at: { label: 'Utworzono', render: formatDateTime, readonly: true },
        updated_at: { label: 'Zaktualizowano', render: formatDateTime, readonly: true },
        created_by: { label: 'Utworzył', hidden: true, readonly: true },
        notes: { label: 'Notatki', input: textareaInput },
        email: { label: 'Email', validate: validateEmail },
        phone: { label: 'Telefon' },
    },

    properties: {
        name: { label: 'Nazwa', required: true },
        address: { label: 'Adres', required: true },
        property_type: {
            label: 'Typ nieruchomości',
            render: renderPropertyType,
            input: selectPropertyType,
        },
        monthly_rent: {
            label: 'Czynsz miesięczny',
            render: formatCurrency,
            input: currencyInput,
            required: true,
        },
        deposit_amount: { label: 'Kaucja', render: formatCurrency, input: currencyInput },
        status: {
            label: 'Status',
            render: renderPropertyStatus,
            input: selectPropertyStatus,
        },
        size_sqm: { label: 'Powierzchnia (m²)' },
        bedrooms: { label: 'Sypialnie' },
    },

    tenants: {
        first_name: { label: 'Imię', required: true },
        last_name: { label: 'Nazwisko', required: true },
        email: { label: 'Email', required: true, validate: validateEmail },
        phone: { label: 'Telefon', required: true },
        status: { label: 'Status', render: renderTenantStatus, input: selectTenantStatus },
        id_document_number: { label: 'Nr dokumentu' },
        emergency_contact_name: { label: 'Kontakt awaryjny' },
        emergency_contact_phone: { label: 'Tel. kontaktu awaryjnego' },
        user_id: { label: 'ID użytkownika', hidden: true, readonly: true },
    },

    lease_agreements: {
        start_date: { label: 'Data rozpoczęcia', render: formatDate, input: dateInput, required: true },
        end_date: { label: 'Data zakończenia', render: formatDate, input: dateInput },
        monthly_rent: { label: 'Czynsz', render: formatCurrency, input: currencyInput, required: true },
        deposit_amount: { label: 'Kaucja', render: formatCurrency, input: currencyInput, required: true },
        status: { label: 'Status', render: renderLeaseStatus, input: selectLeaseStatus },
        tenant_id: { label: 'Najemca', hidden: true },
        property_id: { label: 'Nieruchomość', hidden: false, render: renderLeaseProperty },
    },

    transactions: {
        type: { label: 'Typ', render: renderTransactionType, input: selectTransactionType, required: true },
        description: { label: 'Opis', required: true },
        amount: { label: 'Kwota', render: formatCurrency, input: currencyInput, required: true },
        due_date: { label: 'Termin', render: formatDate, input: dateInput, required: true },
        status: {
            label: 'Status',
            render: renderTransactionStatus,
            input: selectTransactionStatus,
        },
        lease_id: { label: 'Umowa', hidden: true },
        property_id: { label: 'Nieruchomość', hidden: true },
    },

    attachments: {
        file_name: { label: 'Nazwa pliku', required: true },
        file_url: { label: 'URL', readonly: true },
        file_type: { label: 'Typ pliku', render: renderFileType },
        file_size: { label: 'Rozmiar', render: formatFileSize, readonly: true },
        description: { label: 'Opis' },
        related_to_id: { label: 'ID powiązania', hidden: true },
        related_to_type: { label: 'Typ powiązania', hidden: true },
    },

    user_roles: {
        user_id: { label: 'ID użytkownika', hidden: true, readonly: true },
        role: { label: 'Rola', readonly: true },
    },

    // ── Views ───────────────────────────────────────────────────

    active_leases: {
        tenant_name: { label: 'Najemca' },
        tenant_email: { label: 'Email najemcy' },
        tenant_phone: { label: 'Telefon najemcy' },
        property_name: { label: 'Nieruchomość' },
        property_address: { label: 'Adres' },
        property_type: { label: 'Typ nieruchomości', render: renderPropertyType },
        start_date: { label: 'Data rozpoczęcia', render: formatDate },
        end_date: { label: 'Data zakończenia', render: formatDate },
        monthly_rent: { label: 'Czynsz', render: formatCurrency },
        deposit_amount: { label: 'Kaucja', render: formatCurrency },
        status: { label: 'Status', render: renderLeaseStatus },
        days_active: { label: 'Dni aktywnych' },
        days_until_end: { label: 'Dni do końca' },
    },

    property_financial_summary: {
        property_name: { label: 'Nieruchomość' },
        address: { label: 'Adres' },
        status: { label: 'Status', render: renderPropertyStatus },
        monthly_rent: { label: 'Czynsz', render: formatCurrency },
        total_income: { label: 'Przychody', render: formatCurrency },
        total_expenses: { label: 'Wydatki', render: formatCurrency },
        net_profit: { label: 'Zysk netto', render: formatCurrency },
    },

    property_occupancy: {
        name: { label: 'Nazwa' },
        address: { label: 'Adres' },
        property_type: { label: 'Typ', render: renderPropertyType },
        status: { label: 'Status', render: renderPropertyStatus },
        monthly_rent: { label: 'Czynsz', render: formatCurrency },
        current_tenant_name: { label: 'Obecny najemca' },
        current_rent: { label: 'Obecny czynsz', render: formatCurrency },
        lease_start: { label: 'Początek najmu', render: formatDate },
        lease_end: { label: 'Koniec najmu', render: formatDate },
        size_sqm: { label: 'Powierzchnia (m²)' },
        bedrooms: { label: 'Sypialnie' },
    },

    unpaid_transactions_summary: {
        tenant_name: { label: 'Najemca' },
        property_name: { label: 'Nieruchomość' },
        unpaid_items_count: { label: 'Nieopłacone' },
        total_unpaid_amount: { label: 'Kwota nieopłacona', render: formatCurrency },
        overdue_items_count: { label: 'Zaległe' },
        total_overdue_amount: { label: 'Kwota zaległa', render: formatCurrency },
        earliest_due_date: { label: 'Najwcześniejszy termin', render: formatDate },
    },
};

// ── Auto-deduction (Priority 4) ─────────────────────────────────────

const autoDeduceFromKey = (key: string): ColumnConfig => {
    const label = key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

    return key === 'id'
        ? { label: 'ID', hidden: true, readonly: true }
        : key.endsWith('_id')
            ? { label, hidden: true }
            : key.endsWith('_at')
                ? { label, render: formatDateTime, readonly: true }
                : key.endsWith('_date')
                    ? { label, render: formatDate }
                    : key.startsWith('is_')
                        ? { label, render: renderBoolean }
                        : { label };
};

// ── Resolution helper ───────────────────────────────────────────────

export const resolveColumnConfig = (
    tableName: string,
    columnKey: string,
    perUsageOverride?: Partial<ColumnConfig>,
): ColumnConfig => ({
    ...autoDeduceFromKey(columnKey),
    ...(COLUMN_REGISTRY._global?.[columnKey] ?? {}),
    ...((COLUMN_REGISTRY as Record<string, Record<string, ColumnConfig> | undefined>)[tableName]?.[columnKey] ?? {}),
    ...(perUsageOverride ?? {}),
});
