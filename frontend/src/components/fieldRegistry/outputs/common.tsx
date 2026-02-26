'use client';
import React from 'react';
import { formatDate, formatDateTime, formatCurrency } from '../formatters';
import type { FieldOutputFn } from '../types';

// ── Null Placeholder ──────────────────────────────────────────────────

/** Null value placeholder */
export const outputNull = (): React.ReactNode => <span className="cellNull">—</span>;

// ── Primitive Outputs ─────────────────────────────────────────────────

/** Text output */
export const outputText: FieldOutputFn<unknown> = (value) =>
    value === null || value === undefined
        ? outputNull()
        : <span className="cellText">{String(value)}</span>;

/** Number output with sign-based colors */
export const outputNumber: FieldOutputFn<unknown> = (value) => {
    const numValue = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
    const colorClass = isNaN(numValue)
        ? ''
        : numValue > 0
            ? ' cellNumberPositive'
            : numValue < 0
                ? ' cellNumberNegative'
                : ' cellNumberZero';
    return value === null || value === undefined
        ? outputNull()
        : <span className={`cellNumber${colorClass}`}>{String(value)}</span>;
};

/** Boolean output with check/cross icons */
export const outputBoolean: FieldOutputFn<unknown> = (value) =>
    value === null || value === undefined
        ? outputNull()
        : value === true
            ? <span className="cellBoolean cellBooleanTrue">✓ Tak</span>
            : <span className="cellBoolean cellBooleanFalse">✗ Nie</span>;

// ── Currency Output ───────────────────────────────────────────────────

/** Currency output with styling - negative values shown in red */
export const outputCurrency: FieldOutputFn<unknown> = (value) => {
    const numValue = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
    const isNegative = !isNaN(numValue) && numValue < 0;
    return value === null || value === undefined
        ? outputNull()
        : <span className={`cellCurrency${isNegative ? ' cellCurrencyNegative' : ''}`}>{formatCurrency(value)}</span>;
};

// ── Date Outputs ──────────────────────────────────────────────────────

/** Date output with formatting */
export const outputDate: FieldOutputFn<unknown> = (value) =>
    value === null || value === undefined
        ? outputNull()
        : <span className="cellDate">{formatDate(value)}</span>;

/** DateTime output with formatting */
export const outputDateTime: FieldOutputFn<unknown> = (value) =>
    value === null || value === undefined
        ? outputNull()
        : <span className="cellDateTime">{formatDateTime(value)}</span>;

// ── Specialized Number Outputs ────────────────────────────────────────

/** Days count output with urgency colors (for days_until_end, days_active) */
export const outputDaysCount: FieldOutputFn<unknown> = (value) => {
    const numValue = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
    const colorClass = isNaN(numValue)
        ? ''
        : numValue < 0
            ? ' cellDaysOverdue'
            : numValue <= 7
                ? ' cellDaysWarning'
                : numValue <= 30
                    ? ' cellDaysNormal'
                    : ' cellDaysSafe';
    return value === null || value === undefined
        ? outputNull()
        : <span className={`cellNumber${colorClass}`}>{String(value)}</span>;
};

/** Item count output with severity colors (for unpaid_items_count, overdue_items_count) */
export const outputItemCount: FieldOutputFn<unknown> = (value) => {
    const numValue = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
    const colorClass = isNaN(numValue)
        ? ''
        : numValue === 0
            ? ' cellCountGood'
            : numValue <= 3
                ? ' cellCountWarning'
                : ' cellCountCritical';
    return value === null || value === undefined
        ? outputNull()
        : <span className={`cellNumber${colorClass}`}>{String(value)}</span>;
};

// ── File Size Output ──────────────────────────────────────────────────

/** File size formatter */
export const outputFileSize: FieldOutputFn<unknown> = (value) => {
    const num = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
    return isNaN(num) || num === null
        ? outputNull()
        : <span className="cellFileSize">
            {num < 1024
                ? `${num} B`
                : num < 1024 * 1024
                    ? `${(num / 1024).toFixed(1)} KB`
                    : `${(num / (1024 * 1024)).toFixed(1)} MB`}
        </span>;
};