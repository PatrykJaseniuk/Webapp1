'use client';
import type React from 'react';
import type { FieldRendererFn } from './types';
import { formatCurrency } from './basicRenderers';
import computedStyles from '@/components/styles/computedRenderers.module.css';
import relationStyles from '@/components/styles/relationRenderers.module.css';
import { routes } from '@/api/routes/appRoutes';
import Link from 'next/link';

// ── Helper: Extract array from value ──────────────────────────────

const extractArray = <T,>(value: unknown): T[] =>
    value === null || value === undefined
        ? []
        : Array.isArray(value)
            ? value
            : [value as T];

const outputNull = (): React.ReactNode => <span className={computedStyles.nullRenderer}>—</span>;

// ── Enum Labels (shared with renderers.tsx) ────────────────────────

const LEASE_STATUS_LABELS: Record<string, string> = {
    active: 'Aktywna',
    expired: 'Wygasła',
    terminated: 'Rozwiązana',
};

const TRANSACTION_STATUS_LABELS: Record<string, string> = {
    pending: 'Oczekująca',
    paid: 'Opłacona',
    overdue: 'Zaległa',
};

// ── Status & Badge Class Helpers ───────────────────────────────────

const getLeaseStatusClass = (status?: string): string => {
    const statusMap: Record<string, string> = {
        active: relationStyles.leaseStatusActiveRenderer,
        expired: relationStyles.leaseStatusExpiredRenderer,
        terminated: relationStyles.leaseStatusTerminatedRenderer,
        draft: relationStyles.leaseStatusDraftRenderer,
    };
    return statusMap[status ?? ''] ?? relationStyles.leaseStatusDefaultRenderer;
};

const getTransactionStatusClass = (status?: string): string => {
    const statusMap: Record<string, string> = {
        paid: relationStyles.transactionStatusPaidRenderer,
        pending: relationStyles.transactionStatusPendingRenderer,
        overdue: relationStyles.transactionStatusOverdueRenderer,
        cancelled: relationStyles.transactionStatusCancelledRenderer,
    };
    return statusMap[status ?? ''] ?? relationStyles.transactionStatusDefaultRenderer;
};

const getRelationBadgeClass = (type?: 'error' | 'warning' | 'type'): string => {
    const typeMap: Record<string, string> = {
        error: relationStyles.relationBadgeErrorRenderer,
        warning: relationStyles.relationBadgeWarningRenderer,
        type: relationStyles.relationBadgeTypeRenderer,
    };
    return type ? (typeMap[type] ?? '') : '';
};

const createReadOnlyRenderer = (render: (value: unknown) => React.ReactNode): FieldRendererFn =>
    ({ value }) => render(value);

// ── Tenants Relation ───────────────────────────────────────────────

export const tenantsRelationRenderer = createReadOnlyRenderer((value) => {
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
                className={relationStyles.relationLinkRenderer}
            >
                {t.first_name} {t.last_name}
            </Link> :
            <span className={relationStyles.relationNameRenderer}>{t?.first_name} {t?.last_name}</span>;

    const renderArray = () =>
        <div className={relationStyles.relationBadgesRenderer}>
            {tenants.slice(0, 3).map((t, i) =>
                <span key={t?.id ?? i} className={relationStyles.relationBadgeRenderer}>
                    {t?.first_name} {t?.last_name}
                </span>
            )}
            {tenants.length > 3 ?
                <span className={`${relationStyles.relationBadgeRenderer} ${relationStyles.relationBadgeMoreRenderer}`}>+{tenants.length - 3}</span> :
                null}
        </div>;

    return tenants.length === 0 ?
        outputNull() :
        Array.isArray(value) ?
            renderArray() :
            renderSingle(tenants[0]);
});

// ── Lease Agreements Relation ──────────────────────────────────────

export const leaseAgreementsRelationRenderer = createReadOnlyRenderer((value) => {
    const leases = extractArray<{
        id?: string;
        lease_status?: string;
        monthly_rent?: number;
        start_date?: string;
        end_date?: string;
        tenants?: { first_name?: string; last_name?: string } | null;
    }>(value);

    const active = leases.find(l => l?.lease_status === 'active');

    const renderSingle = (lease: typeof leases[0]) =>
        lease?.id
            ? <Link
                href={routes.landlord.leases({ id: lease.id })}
                onClick={(e) => e.stopPropagation()}
                className={relationStyles.relationLinkRenderer}
            >
                <span className={`${relationStyles.leaseStatusRenderer} ${getLeaseStatusClass(lease?.lease_status)}`}>
                    {LEASE_STATUS_LABELS[lease?.lease_status ?? ''] ?? lease?.lease_status ?? '—'}
                </span>
                <span className={relationStyles.leaseRentRenderer}>{formatCurrency(lease?.monthly_rent ?? 0)}</span>
            </Link>
            : <div className={relationStyles.relationSingleRenderer}>
                <span className={`${relationStyles.leaseStatusRenderer} ${getLeaseStatusClass(lease?.lease_status)}`}>
                    {LEASE_STATUS_LABELS[lease?.lease_status ?? ''] ?? lease?.lease_status ?? '—'}
                </span>
                <span className={relationStyles.leaseRentRenderer}>{formatCurrency(lease?.monthly_rent ?? 0)}</span>
            </div>;

    const renderArray = () =>
        <div className={relationStyles.relationSingleRenderer}>
            <span className={relationStyles.leasesCountRenderer}>{leases.length} umów</span>
            {active
                ? <span className={relationStyles.leasesActiveRenderer}>{formatCurrency(active.monthly_rent ?? 0)}/mies</span>
                : <span className={relationStyles.leasesHintRenderer}>brak aktywnych</span>}
        </div>;

    return leases.length === 0 ?
        <span className={computedStyles.nullRenderer}>Brak umów</span> :
        Array.isArray(value) ?
            renderArray() :
            renderSingle(leases[0]);
});

// ── Properties Relation ────────────────────────────────────────────

export const propertiesRelationRenderer = createReadOnlyRenderer((value) => {
    const properties = extractArray<{
        id?: string;
        name?: string;
        address?: string;
        property_status?: string;
        property_type?: string;
    }>(value);

    const renderSingle = (p: typeof properties[0]) =>
        p?.id ?
            <div className={relationStyles.relationSingleRenderer}>
                <Link
                    href={routes.landlord.properties({ id: p.id })}
                    onClick={(e) => e.stopPropagation()}
                    className={relationStyles.relationLinkRenderer}
                >
                    {p.name}
                </Link>
                <span className={relationStyles.relationSubRenderer}>{p?.address}</span>
            </div> :
            <div className={relationStyles.relationSingleRenderer}>
                <span className={relationStyles.relationNameRenderer}>{p?.name}</span>
                <span className={relationStyles.relationSubRenderer}>{p?.address}</span>
            </div>;

    const renderArray = () =>
        <div className={relationStyles.relationBadgesRenderer}>
            <span className={relationStyles.relationBadgeRenderer}>{properties.length} nieruchomości</span>
            {properties.slice(0, 2).map((p, i) =>
                <span key={p?.id ?? i} className={`${relationStyles.relationBadgeRenderer} ${getRelationBadgeClass('type')}`}>
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

// ── Transactions Relation ──────────────────────────────────────────

export const transactionsRelationRenderer = createReadOnlyRenderer((value) => {
    const transactions = extractArray<{
        id?: string;
        transaction_status?: string;
        amount?: number;
        due_date?: string;
        type?: string;
    }>(value);

    const overdue = transactions.filter(t => t?.transaction_status === 'overdue');
    const pending = transactions.filter(t => t?.transaction_status === 'pending');

    const renderSingle = (t: typeof transactions[0]) =>
        t?.id ?
            <Link
                href={routes.landlord.transactions({ id: t.id })}
                onClick={(e) => e.stopPropagation()}
                className={relationStyles.relationLinkRenderer}
            >
                <span className={`${relationStyles.transactionStatusRenderer} ${getTransactionStatusClass(t?.transaction_status)}`}>
                    {TRANSACTION_STATUS_LABELS[t?.transaction_status ?? ''] ?? t?.transaction_status ?? '—'}
                </span>
                <span className={relationStyles.transactionAmountRenderer}>{formatCurrency(t?.amount ?? 0)}</span>
            </Link> :
            <div className={relationStyles.relationSingleRenderer}>
                <span className={`${relationStyles.transactionStatusRenderer} ${getTransactionStatusClass(t?.transaction_status)}`}>
                    {TRANSACTION_STATUS_LABELS[t?.transaction_status ?? ''] ?? t?.transaction_status ?? '—'}
                </span>
                <span className={relationStyles.transactionAmountRenderer}>{formatCurrency(t?.amount ?? 0)}</span>
            </div>;

    const renderArray = () =>
        <div className={relationStyles.relationSingleRenderer}>
            <span className={relationStyles.transactionsCountRenderer}>{transactions.length} transakcji</span>
            {overdue.length > 0
                ? <span className={`${relationStyles.relationBadgeRenderer} ${getRelationBadgeClass('error')}`}>{overdue.length} zaległych</span>
                : pending.length > 0
                    ? <span className={`${relationStyles.relationBadgeRenderer} ${getRelationBadgeClass('warning')}`}>{pending.length} oczekujących</span>
                    : null}
        </div>;

    return transactions.length === 0
        ? outputNull()
        : Array.isArray(value)
            ? renderArray()
            : renderSingle(transactions[0]);
});

// ── Attachments Relation ───────────────────────────────────────────

export const attachmentsRelationRenderer = createReadOnlyRenderer((value) => {
    const attachments = extractArray<{
        id?: string;
        file_name?: string;
        file_type?: string;
        file_size?: number;
    }>(value);

    return attachments.length === 0
        ? outputNull()
        : <span className={relationStyles.relationBadgeRenderer}>{attachments.length} plików</span>;
});