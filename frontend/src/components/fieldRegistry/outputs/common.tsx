'use client';
import React from 'react';
import { formatDate, formatDateTime, formatCurrency } from '../formatters';
import type { FieldOutputFn } from '../types';
import styles from '@/components/styles/cellRenderers.module.css';

// ── Null Placeholder ──────────────────────────────────────────────────

/** Null value placeholder */
export const outputNull = (): React.ReactNode => <span className={styles.cellNull}>—</span>;

// ── Primitive Outputs ─────────────────────────────────────────────────

/** Text output */
export const outputText: FieldOutputFn = (value) =>
    value === null || value === undefined
        ? outputNull()
        : <span className={styles.cellText}>{String(value)}</span>;

/** Number output with sign-based colors */
export const outputNumber: FieldOutputFn = (value) => {
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
};

/** Boolean output with check/cross icons */
export const outputBoolean: FieldOutputFn = (value) =>
    value === null || value === undefined
        ? outputNull()
        : value === true
            ? <span className={styles.cellBoolean + ' ' + styles.cellBooleanTrue}>✓ Tak</span>
            : <span className={styles.cellBoolean + ' ' + styles.cellBooleanFalse}>✗ Nie</span>;

// ── Currency Output ───────────────────────────────────────────────────

/** Currency output with styling - negative values shown in red */
export const outputCurrency: FieldOutputFn = (value) => {
    const numValue = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
    const isNegative = !isNaN(numValue) && numValue < 0;
    const className = isNegative
        ? styles.cellCurrency + ' ' + styles.cellCurrencyNegative
        : styles.cellCurrency;
    return value === null || value === undefined
        ? outputNull()
        : <span className={className}>{formatCurrency(value)}</span>;
};

// ── Date Outputs ──────────────────────────────────────────────────────

/** Date output with formatting */
export const outputDate: FieldOutputFn = (value) =>
    value === null || value === undefined
        ? outputNull()
        : <span className={styles.cellDate}>{formatDate(value)}</span>;

/** DateTime output with formatting */
export const outputDateTime: FieldOutputFn = (value) =>
    value === null || value === undefined
        ? outputNull()
        : <span className={styles.cellDateTime}>{formatDateTime(value)}</span>;

// ── Specialized Number Outputs ────────────────────────────────────────

/** Days count output with urgency colors (for days_until_end, days_active) */
export const outputDaysCount: FieldOutputFn = (value) => {
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
};

/** Item count output with severity colors (for unpaid_items_count, overdue_items_count) */
export const outputItemCount: FieldOutputFn = (value) => {
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
};

// ── File Size Output ──────────────────────────────────────────────────

/** File size formatter */
export const outputFileSize: FieldOutputFn = (value) => {
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
};