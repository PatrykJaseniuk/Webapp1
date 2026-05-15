'use client';
import React from 'react';
import { formatDate, formatDateTime, formatCurrency } from './formatters';
import type { FieldRendererFn } from './types';
import cellStyles from '@/components/styles/cellRenderers.module.css';
import relationStyles from '@/components/styles/relationCells.module.css';
import { routes } from '@/api/routes/appRoutes';
import Link from 'next/link';

// ── Enum Labels (matching DB CHECK constraints) ────────────────────────

const PROPERTY_TYPE_LABELS: Record<string, string> = {
    apartment: '🏠 Mieszkanie',
    house: '🏡 Dom',
    commercial: '🏢 Lokal usługowy',
    room: '🛏️ Pokój',
} as const;

const PROPERTY_STATUS_LABELS: Record<string, string> = {
    available: 'Dostępna',
    occupied: 'Zajęta',
    inactive: 'Nieaktywna',
} as const;

const TENANT_STATUS_LABELS: Record<string, string> = {
    active: 'Aktywny',
    past: 'Były',
    applicant: 'Kandydat',
} as const;

const LEASE_STATUS_LABELS: Record<string, string> = {
    active: 'Aktywna',
    expired: 'Wygasła',
    terminated: 'Rozwiązana',
} as const;

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
    rent: '💰 Czynsz',
    utility: '💡 Media',
    expense: '📤 Wydatek',
    payment: '💳 Wpłata',
    withdraw: '🏧 Wypłata',
    fee: '📋 Opłata',
    other: '📎 Inne',
} as const;

const TRANSACTION_STATUS_LABELS: Record<string, string> = {
    pending: 'Oczekująca',
    paid: 'Opłacona',
    overdue: 'Zaległa',
} as const;

const FILE_TYPE_LABELS: Record<string, string> = {
    image: '🖼️ Obraz',
    video: '🎥 Wideo',
    pdf: '📄 PDF',
    document: '📝 Dokument',
    other: '📎 Inny',
} as const;

// ── Enum Color Maps ────────────────────────────────────────────────────

const PROPERTY_TYPE_COLORS: Record<string, string> = {
    apartment: cellStyles.cellEnumBlue,
    house: cellStyles.cellEnumGreen,
    commercial: cellStyles.cellEnumPurple,
    room: cellStyles.cellEnumOrange,
};

const PROPERTY_STATUS_COLORS: Record<string, string> = {
    available: cellStyles.cellStatusSuccess,
    occupied: cellStyles.cellStatusWarning,
    inactive: cellStyles.cellStatusMuted,
};

const TENANT_STATUS_COLORS: Record<string, string> = {
    active: cellStyles.cellStatusSuccess,
    past: cellStyles.cellStatusMuted,
    applicant: cellStyles.cellStatusInfo,
};

const LEASE_STATUS_COLORS: Record<string, string> = {
    active: cellStyles.cellStatusSuccess,
    expired: cellStyles.cellStatusMuted,
    terminated: cellStyles.cellStatusError,
};

const TRANSACTION_TYPE_COLORS: Record<string, string> = {
    rent: cellStyles.cellEnumBlue,
    utility: cellStyles.cellEnumYellow,
    expense: cellStyles.cellEnumRed,
    payment: cellStyles.cellEnumGreen,
    withdraw: cellStyles.cellEnumOrange,
    fee: cellStyles.cellEnumPurple,
    other: cellStyles.cellEnumGray,
};

const TRANSACTION_STATUS_COLORS: Record<string, string> = {
    paid: cellStyles.cellStatusSuccess,
    pending: cellStyles.cellStatusWarning,
    overdue: cellStyles.cellStatusError,
};

const FILE_TYPE_COLORS: Record<string, string> = {
    image: cellStyles.cellEnumBlue,
    video: cellStyles.cellEnumPurple,
    pdf: cellStyles.cellEnumRed,
    document: cellStyles.cellEnumGreen,
    other: cellStyles.cellEnumGray,
};

// ── Null Placeholder ──────────────────────────────────────────────────

/** Null value placeholder */
export const outputNull = (): React.ReactNode => <span className={cellStyles.cellNull}>—</span>;

const createReadOnlyRenderer = (render: (value: unknown) => React.ReactNode): FieldRendererFn =>
    ({ value }) => render(value);

// ── Primitive Outputs ─────────────────────────────────────────────────

/** Text output */
export const outputText = createReadOnlyRenderer((value) =>
    value === null || value === undefined
        ? outputNull()
        : <span className={cellStyles.cellText}>{String(value)}</span>);

/** Number output with sign-based colors */
export const outputNumber = createReadOnlyRenderer((value) => {
    const numValue = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
    const colorClass = isNaN(numValue)
        ? ''
        : numValue > 0
            ? cellStyles.cellNumberPositive
            : numValue < 0
                ? cellStyles.cellNumberNegative
                : cellStyles.cellNumberZero;
    const className = colorClass ? cellStyles.cellNumber + ' ' + colorClass : cellStyles.cellNumber;
    return value === null || value === undefined
        ? outputNull()
        : <span className={className}>{String(value)}</span>;
});

/** Boolean output with check/cross icons */
export const outputBoolean = createReadOnlyRenderer((value) =>
    value === null ?
        outputNull() :
        value === true ?
            <span className={cellStyles.cellBoolean + ' ' + cellStyles.cellBooleanTrue}>✓ Tak</span> :
            <span className={cellStyles.cellBoolean + ' ' + cellStyles.cellBooleanFalse}>✗ Nie</span>);

// ── Currency Output ───────────────────────────────────────────────────

/** Currency output with styling - negative values shown in red */
export const outputCurrency = createReadOnlyRenderer((value) => {
    const numValue = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
    const isNegative = !isNaN(numValue) && numValue < 0;
    const className = isNegative
        ? cellStyles.cellCurrency + ' ' + cellStyles.cellCurrencyNegative
        : cellStyles.cellCurrency;
    return value === null || value === undefined
        ? outputNull()
        : <span className={className}>{formatCurrency(value)}</span>;
});

// ── Date Outputs ──────────────────────────────────────────────────────

/** Date output with formatting */
export const outputDate = createReadOnlyRenderer((value) =>
    value === null || value === undefined
        ? outputNull()
        : <span className={cellStyles.cellDate}>{formatDate(value)}</span>);

/** DateTime output with formatting */
export const outputDateTime = createReadOnlyRenderer((value) =>
    value === null || value === undefined
        ? outputNull()
        : <span className={cellStyles.cellDateTime}>{formatDateTime(value)}</span>);

// ── Specialized Number Outputs ────────────────────────────────────────

/** Days count output with urgency colors (for days_until_end, days_active) */
export const outputDaysCount = createReadOnlyRenderer((value) => {
    const numValue = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
    const colorClass = isNaN(numValue)
        ? ''
        : numValue < 0
            ? cellStyles.cellDaysOverdue
            : numValue <= 7
                ? cellStyles.cellDaysWarning
                : numValue <= 30
                    ? cellStyles.cellDaysNormal
                    : cellStyles.cellDaysSafe;
    const className = colorClass ? cellStyles.cellNumber + ' ' + colorClass : cellStyles.cellNumber;
    return value === null || value === undefined
        ? outputNull()
        : <span className={className}>{String(value)}</span>;
});

/** Item count output with severity colors (for unpaid_items_count, overdue_items_count) */
export const outputItemCount = createReadOnlyRenderer((value) => {
    const numValue = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
    const colorClass = isNaN(numValue)
        ? ''
        : numValue === 0
            ? cellStyles.cellCountGood
            : numValue <= 3
                ? cellStyles.cellCountWarning
                : cellStyles.cellCountCritical;
    const className = colorClass ? cellStyles.cellNumber + ' ' + colorClass : cellStyles.cellNumber;
    return value === null || value === undefined
        ? outputNull()
        : <span className={className}>{String(value)}</span>;
});

// ── File Size Output ──────────────────────────────────────────────────

/** File size formatter */
export const outputFileSize = createReadOnlyRenderer((value) => {
    const num = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
    return isNaN(num) || num === null
        ? outputNull()
        : <span className={cellStyles.cellFileSize}>
            {num < 1024
                ? num + ' B'
                : num < 1024 * 1024
                    ? (num / 1024).toFixed(1) + ' KB'
                    : (num / (1024 * 1024)).toFixed(1) + ' MB'}
        </span>;
});

// ── Enum Output Functions ─────────────────────────────────────────────

/** Generic enum badge renderer with color */
const outputEnumBadge = (
    value: unknown,
    labels: Record<string, string>,
    colors: Record<string, string>,
    baseClass: string,
): React.ReactNode => {
    if (value === null || value === undefined) return outputNull();
    const key = String(value);
    const label = labels[key] ?? key;
    const colorClass = colors[key] ?? '';
    const className = colorClass ? `${baseClass} ${colorClass}` : baseClass;
    return <span className={className}>{label}</span>;
};

/** Property type output - colored badge with emoji */
export const outputPropertyType = createReadOnlyRenderer((value) =>
    outputEnumBadge(value, PROPERTY_TYPE_LABELS, PROPERTY_TYPE_COLORS, cellStyles.cellEnum));

/** Property status output - colored status pill */
export const outputPropertyStatus = createReadOnlyRenderer((value) =>
    outputEnumBadge(value, PROPERTY_STATUS_LABELS, PROPERTY_STATUS_COLORS, cellStyles.cellStatus));

/** Tenant status output - colored status pill */
export const outputTenantStatus = createReadOnlyRenderer((value) =>
    outputEnumBadge(value, TENANT_STATUS_LABELS, TENANT_STATUS_COLORS, cellStyles.cellStatus));

/** Lease status output - colored status pill */
export const outputLeaseStatus = createReadOnlyRenderer((value) =>
    outputEnumBadge(value, LEASE_STATUS_LABELS, LEASE_STATUS_COLORS, cellStyles.cellStatus));

/** Transaction type output - colored badge with emoji */
export const outputTransactionType = createReadOnlyRenderer((value) =>
    outputEnumBadge(value, TRANSACTION_TYPE_LABELS, TRANSACTION_TYPE_COLORS, cellStyles.cellEnum));

/** Transaction status output - colored status pill */
export const outputTransactionStatus = createReadOnlyRenderer((value) =>
    outputEnumBadge(value, TRANSACTION_STATUS_LABELS, TRANSACTION_STATUS_COLORS, cellStyles.cellStatus));

/** File type output - colored badge with emoji */
export const outputFileType = createReadOnlyRenderer((value) =>
    outputEnumBadge(value, FILE_TYPE_LABELS, FILE_TYPE_COLORS, cellStyles.cellEnum));

// ── Helper Functions ──────────────────────────────────────────────────

/** Helper: Extract array from value (handles both object and array) */
const extractArray = <T,>(value: unknown): T[] =>
    value === null || value === undefined
        ? []
        : Array.isArray(value)
            ? value
            : [value as T];

/** Helper: Get lease status class */
const getLeaseStatusClass = (status?: string): string => {
    const statusMap: Record<string, string> = {
        active: relationStyles.cellLeaseStatusActive,
        expired: relationStyles.cellLeaseStatusExpired,
        terminated: relationStyles.cellLeaseStatusTerminated,
        draft: relationStyles.cellLeaseStatusDraft,
    };
    return statusMap[status ?? ''] ?? relationStyles.cellLeaseStatusDefault;
};

/** Helper: Get transaction status class */
const getTransactionStatusClass = (status?: string): string => {
    const statusMap: Record<string, string> = {
        paid: relationStyles.cellTransactionStatusPaid,
        pending: relationStyles.cellTransactionStatusPending,
        overdue: relationStyles.cellTransactionStatusOverdue,
        cancelled: relationStyles.cellTransactionStatusCancelled,
    };
    return statusMap[status ?? ''] ?? relationStyles.cellTransactionStatusDefault;
};

/** Helper: Get relation badge class */
const getRelationBadgeClass = (type?: 'error' | 'warning' | 'type'): string => {
    const typeMap: Record<string, string> = {
        error: relationStyles.cellRelationBadgeError,
        warning: relationStyles.cellRelationBadgeWarning,
        type: relationStyles.cellRelationBadgeType,
    };
    return type ? (typeMap[type] ?? '') : '';
};

// ── Tenant Relation Output ────────────────────────────────────────────

/** Tenant relation output - handles object or array */
export const outputTenantsRelation = createReadOnlyRenderer((value) => {
    const tenants = extractArray<{
        id?: string;
        first_name?: string;
        last_name?: string;
        email?: string;
    }>(value);

    const renderSingle = (t: typeof tenants[0]) =>
        t?.id ?
            <Link
                href={routes.landlord.tenants({ id: t.id })}
                onClick={(e) => e.stopPropagation()}
                className={relationStyles.cellRelationLink}
            >
                {t.first_name} {t.last_name}
            </Link> :
            <span className={relationStyles.cellRelationName}>{t?.first_name} {t?.last_name}</span>;

    const renderArray = () =>
        <div className={relationStyles.cellRelationBadges}>
            {tenants.slice(0, 3).map((t, i) =>
                <span key={t?.id ?? i} className={relationStyles.cellRelationBadge}>
                    {t?.first_name} {t?.last_name}
                </span>
            )}
            {tenants.length > 3 ?
                <span className={`${relationStyles.cellRelationBadge} ${relationStyles.cellRelationBadgeMore}`}>+{tenants.length - 3}</span> :
                null}
        </div>;

    return tenants.length === 0 ?
        outputNull() :
        Array.isArray(value) ?
            renderArray() :
            renderSingle(tenants[0]);
});

// ── Lease Agreements Relation Output ──────────────────────────────────

/** Lease agreements relation output - handles object or array */
export const outputLeaseAgreementsRelation = createReadOnlyRenderer((value) => {
    const leases = extractArray<{
        id?: string;
        status?: string;
        monthly_rent?: number;
        start_date?: string;
        end_date?: string;
        tenants?: { first_name?: string; last_name?: string } | null;
    }>(value);

    const active = leases.find(l => l?.status === 'active');

    const renderSingle = (lease: typeof leases[0]) =>
        lease?.id
            ? <Link
                href={routes.landlord.leases({ id: lease.id })}
                onClick={(e) => e.stopPropagation()}
                className={relationStyles.cellRelationLink}
            >
                <span className={`${relationStyles.cellLeaseStatus} ${getLeaseStatusClass(lease?.status)}`}>
                    {LEASE_STATUS_LABELS[lease?.status ?? ''] ?? lease?.status ?? '—'}
                </span>
                <span className={relationStyles.cellLeaseRent}>{formatCurrency(lease?.monthly_rent ?? 0)}</span>
            </Link>
            : <div className={relationStyles.cellRelationSingle}>
                <span className={`${relationStyles.cellLeaseStatus} ${getLeaseStatusClass(lease?.status)}`}>
                    {LEASE_STATUS_LABELS[lease?.status ?? ''] ?? lease?.status ?? '—'}
                </span>
                <span className={relationStyles.cellLeaseRent}>{formatCurrency(lease?.monthly_rent ?? 0)}</span>
            </div>;

    const renderArray = () =>
        <div className={relationStyles.cellRelationSingle}>
            <span className={relationStyles.cellLeasesCount}>{leases.length} umów</span>
            {active
                ? <span className={relationStyles.cellLeasesActive}>{formatCurrency(active.monthly_rent ?? 0)}/mies</span>
                : <span className={relationStyles.cellLeasesHint}>brak aktywnych</span>}
        </div>;


    return leases.length === 0 ?
        <span className={cellStyles.cellNull}>Brak umów</span> :
        Array.isArray(value) ?
            renderArray() :
            renderSingle(leases[0]);
});

// ── Properties Relation Output ───────────────────────────────────────

/** Properties relation output - handles object or array */
export const outputPropertiesRelation = createReadOnlyRenderer((value) => {
    const properties = extractArray<{
        id?: string;
        name?: string;
        address?: string;
        status?: string;
        property_type?: string;
    }>(value);

    const renderSingle = (p: typeof properties[0]) =>
        p?.id ?
            <div className={relationStyles.cellRelationSingle}>
                <Link
                    href={routes.landlord.properties({ id: p.id })}
                    onClick={(e) => e.stopPropagation()}
                    className={relationStyles.cellRelationLink}
                >
                    {p.name}
                </Link>
                <span className={relationStyles.cellRelationSub}>{p?.address}</span>
            </div> :
            <div className={relationStyles.cellRelationSingle}>
                <span className={relationStyles.cellRelationName}>{p?.name}</span>
                <span className={relationStyles.cellRelationSub}>{p?.address}</span>
            </div>;

    const renderArray = () =>
        <div className={relationStyles.cellRelationBadges}>
            <span className={relationStyles.cellRelationBadge}>{properties.length} nieruchomości</span>
            {properties.slice(0, 2).map((p, i) =>
                <span key={p?.id ?? i} className={`${relationStyles.cellRelationBadge} ${getRelationBadgeClass('type')}`}>
                    {p?.name}
                </span>
            )}
        </div>;

    return properties.length === 0 ?
        outputNull() :
        Array.isArray(value) ?
            renderArray() :
            renderSingle(properties[0]);
});

// ── Transactions Relation Output ──────────────────────────────────────

/** Transactions relation output - handles object or array */
export const outputTransactionsRelation = createReadOnlyRenderer((value) => {
    const transactions = extractArray<{
        id?: string;
        status?: string;
        amount?: number;
        due_date?: string;
        type?: string;
    }>(value);

    const overdue = transactions.filter(t => t?.status === 'overdue');
    const pending = transactions.filter(t => t?.status === 'pending');

    const renderSingle = (t: typeof transactions[0]) =>
        t?.id ?
            <Link
                href={routes.landlord.transactions({ id: t.id })}
                onClick={(e) => e.stopPropagation()}
                className={relationStyles.cellRelationLink}
            >
                <span className={`${relationStyles.cellTransactionStatus} ${getTransactionStatusClass(t?.status)}`}>
                    {TRANSACTION_STATUS_LABELS[t?.status ?? ''] ?? t?.status ?? '—'}
                </span>
                <span className={relationStyles.cellTransactionAmount}>{formatCurrency(t?.amount ?? 0)}</span>
            </Link> :
            <div className={relationStyles.cellRelationSingle}>
                <span className={`${relationStyles.cellTransactionStatus} ${getTransactionStatusClass(t?.status)}`}>
                    {TRANSACTION_STATUS_LABELS[t?.status ?? ''] ?? t?.status ?? '—'}
                </span>
                <span className={relationStyles.cellTransactionAmount}>{formatCurrency(t?.amount ?? 0)}</span>
            </div>;

    const renderArray = () =>
        <div className={relationStyles.cellRelationSingle}>
            <span className={relationStyles.cellTransactionsCount}>{transactions.length} transakcji</span>
            {overdue.length > 0
                ? <span className={`${relationStyles.cellRelationBadge} ${getRelationBadgeClass('error')}`}>{overdue.length} zaległych</span>
                : pending.length > 0
                    ? <span className={`${relationStyles.cellRelationBadge} ${getRelationBadgeClass('warning')}`}>{pending.length} oczekujących</span>
                    : null}
        </div>;

    return transactions.length === 0
        ? outputNull()
        : Array.isArray(value)
            ? renderArray()
            : renderSingle(transactions[0]);
});

// ── Attachments Relation Output ───────────────────────────────────────

/** Attachments relation output - handles object or array */
export const outputAttachmentsRelation = createReadOnlyRenderer((value) => {
    const attachments = extractArray<{
        id?: string;
        file_name?: string;
        file_type?: string;
        file_size?: number;
    }>(value);

    return attachments.length === 0
        ? outputNull()
        : <span className={relationStyles.cellRelationBadge}>{attachments.length} plików</span>;
});