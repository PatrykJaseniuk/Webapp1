'use client';
import React from 'react';
import { formatDate, formatDateTime, formatCurrency } from './formatters';
import type { FieldRendererFn } from './types';
import styles from '@/components/styles/cellRenderers.module.css';
import { routes } from '@/routes';
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
    apartment: styles.cellEnumBlue,
    house: styles.cellEnumGreen,
    commercial: styles.cellEnumPurple,
    room: styles.cellEnumOrange,
};

const PROPERTY_STATUS_COLORS: Record<string, string> = {
    available: styles.cellStatusSuccess,
    occupied: styles.cellStatusWarning,
    inactive: styles.cellStatusMuted,
};

const TENANT_STATUS_COLORS: Record<string, string> = {
    active: styles.cellStatusSuccess,
    past: styles.cellStatusMuted,
    applicant: styles.cellStatusInfo,
};

const LEASE_STATUS_COLORS: Record<string, string> = {
    active: styles.cellStatusSuccess,
    expired: styles.cellStatusMuted,
    terminated: styles.cellStatusError,
};

const TRANSACTION_TYPE_COLORS: Record<string, string> = {
    rent: styles.cellEnumBlue,
    utility: styles.cellEnumYellow,
    expense: styles.cellEnumRed,
    payment: styles.cellEnumGreen,
    withdraw: styles.cellEnumOrange,
    fee: styles.cellEnumPurple,
    other: styles.cellEnumGray,
};

const TRANSACTION_STATUS_COLORS: Record<string, string> = {
    paid: styles.cellStatusSuccess,
    pending: styles.cellStatusWarning,
    overdue: styles.cellStatusError,
};

const FILE_TYPE_COLORS: Record<string, string> = {
    image: styles.cellEnumBlue,
    video: styles.cellEnumPurple,
    pdf: styles.cellEnumRed,
    document: styles.cellEnumGreen,
    other: styles.cellEnumGray,
};

// ── Null Placeholder ──────────────────────────────────────────────────

/** Null value placeholder */
export const outputNull = (): React.ReactNode => <span className={styles.cellNull}>—</span>;

const createReadOnlyRenderer = (render: (value: unknown) => React.ReactNode): FieldRendererFn =>
    ({ value }) => render(value);

// ── Primitive Outputs ─────────────────────────────────────────────────

/** Text output */
export const outputText = createReadOnlyRenderer((value) =>
    value === null || value === undefined
        ? outputNull()
        : <span className={styles.cellText}>{String(value)}</span>);

/** Number output with sign-based colors */
export const outputNumber = createReadOnlyRenderer((value) => {
    const numValue = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
    const colorClass = isNaN(numValue)
        ? ''
        : numValue > 0
            ? styles.cellNumberPositive
            : numValue < 0
                ? styles.cellNumberNegative
                : styles.cellNumberZero;
    const className = colorClass ? styles.cellNumber + ' ' + colorClass : styles.cellNumber;
    return value === null || value === undefined
        ? outputNull()
        : <span className={className}>{String(value)}</span>;
});

/** Boolean output with check/cross icons */
export const outputBoolean = createReadOnlyRenderer((value) =>
    value === null ?
        outputNull() :
        value === true ?
            <span className={styles.cellBoolean + ' ' + styles.cellBooleanTrue}>✓ Tak</span> :
            <span className={styles.cellBoolean + ' ' + styles.cellBooleanFalse}>✗ Nie</span>);

// ── Currency Output ───────────────────────────────────────────────────

/** Currency output with styling - negative values shown in red */
export const outputCurrency = createReadOnlyRenderer((value) => {
    const numValue = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
    const isNegative = !isNaN(numValue) && numValue < 0;
    const className = isNegative
        ? styles.cellCurrency + ' ' + styles.cellCurrencyNegative
        : styles.cellCurrency;
    return value === null || value === undefined
        ? outputNull()
        : <span className={className}>{formatCurrency(value)}</span>;
});

// ── Date Outputs ──────────────────────────────────────────────────────

/** Date output with formatting */
export const outputDate = createReadOnlyRenderer((value) =>
    value === null || value === undefined
        ? outputNull()
        : <span className={styles.cellDate}>{formatDate(value)}</span>);

/** DateTime output with formatting */
export const outputDateTime = createReadOnlyRenderer((value) =>
    value === null || value === undefined
        ? outputNull()
        : <span className={styles.cellDateTime}>{formatDateTime(value)}</span>);

// ── Specialized Number Outputs ────────────────────────────────────────

/** Days count output with urgency colors (for days_until_end, days_active) */
export const outputDaysCount = createReadOnlyRenderer((value) => {
    const numValue = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
    const colorClass = isNaN(numValue)
        ? ''
        : numValue < 0
            ? styles.cellDaysOverdue
            : numValue <= 7
                ? styles.cellDaysWarning
                : numValue <= 30
                    ? styles.cellDaysNormal
                    : styles.cellDaysSafe;
    const className = colorClass ? styles.cellNumber + ' ' + colorClass : styles.cellNumber;
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
            ? styles.cellCountGood
            : numValue <= 3
                ? styles.cellCountWarning
                : styles.cellCountCritical;
    const className = colorClass ? styles.cellNumber + ' ' + colorClass : styles.cellNumber;
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
        : <span className={styles.cellFileSize}>
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
    outputEnumBadge(value, PROPERTY_TYPE_LABELS, PROPERTY_TYPE_COLORS, styles.cellEnum));

/** Property status output - colored status pill */
export const outputPropertyStatus = createReadOnlyRenderer((value) =>
    outputEnumBadge(value, PROPERTY_STATUS_LABELS, PROPERTY_STATUS_COLORS, styles.cellStatus));

/** Tenant status output - colored status pill */
export const outputTenantStatus = createReadOnlyRenderer((value) =>
    outputEnumBadge(value, TENANT_STATUS_LABELS, TENANT_STATUS_COLORS, styles.cellStatus));

/** Lease status output - colored status pill */
export const outputLeaseStatus = createReadOnlyRenderer((value) =>
    outputEnumBadge(value, LEASE_STATUS_LABELS, LEASE_STATUS_COLORS, styles.cellStatus));

/** Transaction type output - colored badge with emoji */
export const outputTransactionType = createReadOnlyRenderer((value) =>
    outputEnumBadge(value, TRANSACTION_TYPE_LABELS, TRANSACTION_TYPE_COLORS, styles.cellEnum));

/** Transaction status output - colored status pill */
export const outputTransactionStatus = createReadOnlyRenderer((value) =>
    outputEnumBadge(value, TRANSACTION_STATUS_LABELS, TRANSACTION_STATUS_COLORS, styles.cellStatus));

/** File type output - colored badge with emoji */
export const outputFileType = createReadOnlyRenderer((value) =>
    outputEnumBadge(value, FILE_TYPE_LABELS, FILE_TYPE_COLORS, styles.cellEnum));

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
        active: styles.cellLeaseStatusActive,
        expired: styles.cellLeaseStatusExpired,
        terminated: styles.cellLeaseStatusTerminated,
        draft: styles.cellLeaseStatusDraft,
    };
    return statusMap[status ?? ''] ?? styles.cellLeaseStatusDefault;
};

/** Helper: Get transaction status class */
const getTransactionStatusClass = (status?: string): string => {
    const statusMap: Record<string, string> = {
        paid: styles.cellTransactionStatusPaid,
        pending: styles.cellTransactionStatusPending,
        overdue: styles.cellTransactionStatusOverdue,
        cancelled: styles.cellTransactionStatusCancelled,
    };
    return statusMap[status ?? ''] ?? styles.cellTransactionStatusDefault;
};

/** Helper: Get relation badge class */
const getRelationBadgeClass = (type?: 'error' | 'warning' | 'type'): string => {
    const typeMap: Record<string, string> = {
        error: styles.cellRelationBadgeError,
        warning: styles.cellRelationBadgeWarning,
        type: styles.cellRelationBadgeType,
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
                className={styles.cellRelationLink}
            >
                {t.first_name} {t.last_name}
            </Link> :
            <span className={styles.cellRelationName}>{t?.first_name} {t?.last_name}</span>;

    const renderArray = () =>
        <div className={styles.cellRelationBadges}>
            {tenants.slice(0, 3).map((t, i) =>
                <span key={t?.id ?? i} className={styles.cellRelationBadge}>
                    {t?.first_name} {t?.last_name}
                </span>
            )}
            {tenants.length > 3 ?
                <span className={`${styles.cellRelationBadge} ${styles.cellRelationBadgeMore}`}>+{tenants.length - 3}</span> :
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
                className={styles.cellRelationLink}
            >
                <span className={`${styles.cellLeaseStatus} ${getLeaseStatusClass(lease?.status)}`}>
                    {LEASE_STATUS_LABELS[lease?.status ?? ''] ?? lease?.status ?? '—'}
                </span>
                <span className={styles.cellLeaseRent}>{formatCurrency(lease?.monthly_rent ?? 0)}</span>
            </Link>
            : <div className={styles.cellRelationSingle}>
                <span className={`${styles.cellLeaseStatus} ${getLeaseStatusClass(lease?.status)}`}>
                    {LEASE_STATUS_LABELS[lease?.status ?? ''] ?? lease?.status ?? '—'}
                </span>
                <span className={styles.cellLeaseRent}>{formatCurrency(lease?.monthly_rent ?? 0)}</span>
            </div>;

    const renderArray = () =>
        <div className={styles.cellRelationSingle}>
            <span className={styles.cellLeasesCount}>{leases.length} umów</span>
            {active
                ? <span className={styles.cellLeasesActive}>{formatCurrency(active.monthly_rent ?? 0)}/mies</span>
                : <span className={styles.cellLeasesHint}>brak aktywnych</span>}
        </div>;


    return leases.length === 0 ?
        <span className={styles.cellNull}>Brak umów</span> :
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
            <div className={styles.cellRelationSingle}>
                <Link
                    href={routes.landlord.properties({ id: p.id })}
                    onClick={(e) => e.stopPropagation()}
                    className={styles.cellRelationLink}
                >
                    {p.name}
                </Link>
                <span className={styles.cellRelationSub}>{p?.address}</span>
            </div> :
            <div className={styles.cellRelationSingle}>
                <span className={styles.cellRelationName}>{p?.name}</span>
                <span className={styles.cellRelationSub}>{p?.address}</span>
            </div>;

    const renderArray = () =>
        <div className={styles.cellRelationBadges}>
            <span className={styles.cellRelationBadge}>{properties.length} nieruchomości</span>
            {properties.slice(0, 2).map((p, i) =>
                <span key={p?.id ?? i} className={`${styles.cellRelationBadge} ${getRelationBadgeClass('type')}`}>
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
                className={styles.cellRelationLink}
            >
                <span className={`${styles.cellTransactionStatus} ${getTransactionStatusClass(t?.status)}`}>
                    {TRANSACTION_STATUS_LABELS[t?.status ?? ''] ?? t?.status ?? '—'}
                </span>
                <span className={styles.cellTransactionAmount}>{formatCurrency(t?.amount ?? 0)}</span>
            </Link> :
            <div className={styles.cellRelationSingle}>
                <span className={`${styles.cellTransactionStatus} ${getTransactionStatusClass(t?.status)}`}>
                    {TRANSACTION_STATUS_LABELS[t?.status ?? ''] ?? t?.status ?? '—'}
                </span>
                <span className={styles.cellTransactionAmount}>{formatCurrency(t?.amount ?? 0)}</span>
            </div>;

    const renderArray = () =>
        <div className={styles.cellRelationSingle}>
            <span className={styles.cellTransactionsCount}>{transactions.length} transakcji</span>
            {overdue.length > 0
                ? <span className={`${styles.cellRelationBadge} ${getRelationBadgeClass('error')}`}>{overdue.length} zaległych</span>
                : pending.length > 0
                    ? <span className={`${styles.cellRelationBadge} ${getRelationBadgeClass('warning')}`}>{pending.length} oczekujących</span>
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
        : <span className={styles.cellRelationBadge}>{attachments.length} plików</span>;
});