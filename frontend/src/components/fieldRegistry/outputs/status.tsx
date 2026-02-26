'use client';
import React from 'react';
import type { FieldOutputFn } from '../types';
import { outputNull } from './common';
import {
    PROPERTY_TYPE_LABELS,
    PROPERTY_STATUS_LABELS,
    TENANT_STATUS_LABELS,
    LEASE_STATUS_LABELS,
    TRANSACTION_TYPE_LABELS,
    TRANSACTION_STATUS_LABELS,
    FILE_TYPE_LABELS,
} from '../enumLabels';

// ── Status Color Mappings ─────────────────────────────────────────────

const PROPERTY_STATUS_COLORS: Record<string, string> = {
    available: 'success',
    rented: 'info',
    maintenance: 'warning',
    inactive: 'muted',
};

const TENANT_STATUS_COLORS: Record<string, string> = {
    active: 'success',
    inactive: 'muted',
    pending: 'warning',
};

const LEASE_STATUS_COLORS: Record<string, string> = {
    active: 'success',
    expired: 'muted',
    terminated: 'error',
    draft: 'warning',
};

const TRANSACTION_STATUS_COLORS: Record<string, string> = {
    pending: 'warning',
    paid: 'success',
    overdue: 'error',
    cancelled: 'muted',
};

// ── Factory Functions ─────────────────────────────────────────────────

/** Creates enum label output */
const createEnumOutput = (labels: Record<string, string>): FieldOutputFn<unknown> =>
    (value) =>
        value === null || value === undefined
            ? outputNull()
            : <span className="cellEnum">{labels[value as string] ?? String(value)}</span>;

/** Creates status badge output with color coding */
const createStatusOutput = (labels: Record<string, string>, statusColors: Record<string, string>): FieldOutputFn<unknown> =>
    (value) =>
        value === null || value === undefined
            ? outputNull()
            : <span className={`cellStatus cellStatus--${statusColors[value as string] ?? 'default'}`}>
                {labels[value as string] ?? String(value)}
            </span>;

// ── Pre-built Status Outputs ──────────────────────────────────────────

/** Property type output */
export const outputPropertyType = createEnumOutput(PROPERTY_TYPE_LABELS);

/** Property status output with badge */
export const outputPropertyStatus = createStatusOutput(PROPERTY_STATUS_LABELS, PROPERTY_STATUS_COLORS);

/** Tenant status output with badge */
export const outputTenantStatus = createStatusOutput(TENANT_STATUS_LABELS, TENANT_STATUS_COLORS);

/** Lease status output with badge */
export const outputLeaseStatus = createStatusOutput(LEASE_STATUS_LABELS, LEASE_STATUS_COLORS);

/** Transaction type output */
export const outputTransactionType = createEnumOutput(TRANSACTION_TYPE_LABELS);

/** Transaction status output with badge */
export const outputTransactionStatus = createStatusOutput(TRANSACTION_STATUS_LABELS, TRANSACTION_STATUS_COLORS);

/** File type output */
export const outputFileType = createEnumOutput(FILE_TYPE_LABELS);