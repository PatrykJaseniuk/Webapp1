'use client';
import React from 'react';
import type { FieldOutputFn } from '../types';
import { outputNull } from './common';
import { formatCurrency } from '../formatters';
import { LEASE_STATUS_LABELS, TRANSACTION_STATUS_LABELS } from '../enumLabels';

// ── Helper Functions ──────────────────────────────────────────────────

/** Helper: Extract array from value (handles both object and array) */
const extractArray = <T,>(value: unknown): T[] =>
    value === null || value === undefined
        ? []
        : Array.isArray(value)
            ? value
            : [value as T];

// ── Tenant Relation Output ────────────────────────────────────────────

/** Tenant relation output - handles object or array */
export const outputTenantsRelation: FieldOutputFn<unknown> = (value) => {
    const tenants = extractArray<{
        id?: string;
        first_name?: string;
        last_name?: string;
        email?: string;
    }>(value);

    const renderSingle = (t: typeof tenants[0]) =>
        <span className="cellRelationName">{t?.first_name} {t?.last_name}</span>;

    const renderArray = () =>
        <div className="cellRelationBadges">
            {tenants.slice(0, 3).map((t, i) =>
                <span key={t?.id ?? i} className="cellRelationBadge">
                    {t?.first_name} {t?.last_name}
                </span>
            )}
            {tenants.length > 3
                ? <span className="cellRelationBadge cellRelationBadgeMore">+{tenants.length - 3}</span>
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
export const outputLeaseAgreementsRelation: FieldOutputFn<unknown> = (value) => {
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
        <div className="cellRelationSingle">
            <span className={`cellLeaseStatus cellLeaseStatus--${lease?.status ?? 'default'}`}>
                {LEASE_STATUS_LABELS[lease?.status ?? ''] ?? lease?.status ?? '—'}
            </span>
            <span className="cellLeaseRent">{formatCurrency(lease?.monthly_rent ?? 0)}</span>
        </div>;

    const renderArray = () =>
        <div className="cellRelationSingle">
            <span className="cellLeasesCount">{leases.length} umów</span>
            {active
                ? <span className="cellLeasesActive">{formatCurrency(active.monthly_rent ?? 0)}/mies</span>
                : <span className="cellLeasesHint">brak aktywnych</span>}
        </div>;

    return leases.length === 0
        ? <span className="cellNull">Brak umów</span>
        : Array.isArray(value)
            ? renderArray()
            : renderSingle(leases[0]);
};

// ── Properties Relation Output ───────────────────────────────────────

/** Properties relation output - handles object or array */
export const outputPropertiesRelation: FieldOutputFn<unknown> = (value) => {
    const properties = extractArray<{
        id?: string;
        name?: string;
        address?: string;
        status?: string;
        property_type?: string;
    }>(value);

    const renderSingle = (p: typeof properties[0]) =>
        <div className="cellRelationSingle">
            <span className="cellRelationName">{p?.name}</span>
            <span className="cellRelationSub">{p?.address}</span>
        </div>;

    const renderArray = () =>
        <div className="cellRelationBadges">
            <span className="cellRelationBadge">{properties.length} nieruchomości</span>
            {properties.slice(0, 2).map((p, i) =>
                <span key={p?.id ?? i} className="cellRelationBadge cellRelationBadge--type">
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
export const outputTransactionsRelation: FieldOutputFn<unknown> = (value) => {
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
        <div className="cellRelationSingle">
            <span className={`cellTransactionStatus cellTransactionStatus--${t?.status ?? 'default'}`}>
                {TRANSACTION_STATUS_LABELS[t?.status ?? ''] ?? t?.status ?? '—'}
            </span>
            <span className="cellTransactionAmount">{formatCurrency(t?.amount ?? 0)}</span>
        </div>;

    const renderArray = () =>
        <div className="cellRelationSingle">
            <span className="cellTransactionsCount">{transactions.length} transakcji</span>
            {overdue.length > 0
                ? <span className="cellRelationBadge cellRelationBadge--error">{overdue.length} zaległych</span>
                : pending.length > 0
                    ? <span className="cellRelationBadge cellRelationBadge--warning">{pending.length} oczekujących</span>
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
export const outputAttachmentsRelation: FieldOutputFn<unknown> = (value) => {
    const attachments = extractArray<{
        id?: string;
        file_name?: string;
        file_type?: string;
        file_size?: number;
    }>(value);

    return attachments.length === 0
        ? outputNull()
        : <span className="cellRelationBadge">{attachments.length} plików</span>;
};