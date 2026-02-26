'use client';
import type { FieldInputFn } from '../types';
import {
    PROPERTY_TYPE_LABELS,
    PROPERTY_STATUS_LABELS,
    TENANT_STATUS_LABELS,
    LEASE_STATUS_LABELS,
    TRANSACTION_TYPE_LABELS,
    TRANSACTION_STATUS_LABELS,
} from '../enumLabels';

// ── Select Input Factory ──────────────────────────────────────────────

/** Creates select input from options */
const createSelectInput = (options: Record<string, string>, placeholder = '— Wybierz —'): FieldInputFn =>
    (value, onChange) => (
        <select
            className="inputSelect"
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value || null)}
        >
            <option value="">{placeholder}</option>
            {Object.entries(options).map(([k, v]) => (
                <option key={k} value={k}>
                    {v}
                </option>
            ))}
        </select>
    );

// ── Pre-built Select Inputs ───────────────────────────────────────────

export const inputPropertyType = createSelectInput(PROPERTY_TYPE_LABELS, '— Wybierz typ —');
export const inputPropertyStatus = createSelectInput(PROPERTY_STATUS_LABELS, '— Wybierz status —');
export const inputTenantStatus = createSelectInput(TENANT_STATUS_LABELS, '— Wybierz status —');
export const inputLeaseStatus = createSelectInput(LEASE_STATUS_LABELS, '— Wybierz status —');
export const inputTransactionType = createSelectInput(TRANSACTION_TYPE_LABELS, '— Wybierz typ —');
export const inputTransactionStatus = createSelectInput(TRANSACTION_STATUS_LABELS, '— Wybierz status —');