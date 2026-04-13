'use client';
import React from 'react';
import Link from 'next/link';
import type { FieldOutputFn } from '../types';
import { outputNull } from './common';
import { formatCurrency } from '../formatters';
import { LEASE_STATUS_LABELS, TRANSACTION_STATUS_LABELS } from '../enumLabels';
import { routes } from '@/routes';
import styles from '@/components/styles/cellRenderers.module.css';

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
export const outputTenantsRelation: FieldOutputFn = (value) => {
    const tenants = extractArray<{
        id?: string;
        first_name?: string;
        last_name?: string;
        email?: string;
    }>(value);

    const renderSingle = (t: typeof tenants[0]) =>
        t?.id
            ? <Link
                href={routes.landlord.tenants({ id: t.id })}
                onClick={(e) => e.stopPropagation()}
                className={styles.cellRelationLink}
            >
                {t.first_name} {t.last_name}
            </Link>
            : <span className={styles.cellRelationName}>{t?.first_name} {t?.last_name}</span>;

    const renderArray = () =>
        <div className={styles.cellRelationBadges}>
            {tenants.slice(0, 3).map((t, i) =>
                <span key={t?.id ?? i} className={styles.cellRelationBadge}>
                    {t?.first_name} {t?.last_name}
                </span>
            )}
            {tenants.length > 3
                ? <span className={`${styles.cellRelationBadge} ${styles.cellRelationBadgeMore}`}>+{tenants.length - 3}</span>
                : null}
        </div>;

    return tenants.length === 0
        ? outputNull()
        : Array.isArray(value)
            ? renderArray()
            : renderSingle(tenants[0]);
};

// ── Lease Agreements Relation Output ──────────────────────────────────

/** Lease agreements relation output - handles object or array */
export const outputLeaseAgreementsRelation: FieldOutputFn = (value) => {
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

    return leases.length === 0
        ? <span className={styles.cellNull}>Brak umów</span>
        : Array.isArray(value)
            ? renderArray()
            : renderSingle(leases[0]);
};

// ── Properties Relation Output ───────────────────────────────────────

/** Properties relation output - handles object or array */
export const outputPropertiesRelation: FieldOutputFn = (value) => {
    const properties = extractArray<{
        id?: string;
        name?: string;
        address?: string;
        status?: string;
        property_type?: string;
    }>(value);

    const renderSingle = (p: typeof properties[0]) =>
        p?.id
            ? <div className={styles.cellRelationSingle}>
                <Link
                    href={routes.landlord.properties({ id: p.id })}
                    onClick={(e) => e.stopPropagation()}
                    className={styles.cellRelationLink}
                >
                    {p.name}
                </Link>
                <span className={styles.cellRelationSub}>{p?.address}</span>
            </div>
            : <div className={styles.cellRelationSingle}>
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

    return properties.length === 0
        ? outputNull()
        : Array.isArray(value)
            ? renderArray()
            : renderSingle(properties[0]);
};

// ── Transactions Relation Output ──────────────────────────────────────

/** Transactions relation output - handles object or array */
export const outputTransactionsRelation: FieldOutputFn = (value) => {
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
        t?.id
            ? <Link
                href={routes.landlord.transactions({ id: t.id })}
                onClick={(e) => e.stopPropagation()}
                className={styles.cellRelationLink}
            >
                <span className={`${styles.cellTransactionStatus} ${getTransactionStatusClass(t?.status)}`}>
                    {TRANSACTION_STATUS_LABELS[t?.status ?? ''] ?? t?.status ?? '—'}
                </span>
                <span className={styles.cellTransactionAmount}>{formatCurrency(t?.amount ?? 0)}</span>
            </Link>
            : <div className={styles.cellRelationSingle}>
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
};

// ── Attachments Relation Output ───────────────────────────────────────

/** Attachments relation output - handles object or array */
export const outputAttachmentsRelation: FieldOutputFn = (value) => {
    const attachments = extractArray<{
        id?: string;
        file_name?: string;
        file_type?: string;
        file_size?: number;
    }>(value);

    return attachments.length === 0
        ? outputNull()
        : <span className={styles.cellRelationBadge}>{attachments.length} plików</span>;
};