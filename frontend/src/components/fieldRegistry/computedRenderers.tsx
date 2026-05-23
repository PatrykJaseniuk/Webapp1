'use client';
import type React from 'react';
import type { FieldRendererFn } from './types';
import styles from '@/components/styles/cellRenderers.module.css';
import { FILE_TYPE_OPTIONS_SHARED } from './renderers';

// ── Helpers ────────────────────────────────────────────────────────

const outputNull = (): React.ReactNode => <span className={styles.cellNull}>—</span>;

const createReadOnlyRenderer = (render: (value: unknown) => React.ReactNode): FieldRendererFn =>
    ({ value }) => render(value);

// ── Enum Badge ─────────────────────────────────────────────────────

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

// ── Computed Number Renderers ──────────────────────────────────────

/** Days count output with urgency colors (for days_until_end, days_active) */
export const daysCountRenderer = createReadOnlyRenderer((value) => {
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
export const itemCountRenderer = createReadOnlyRenderer((value) => {
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

// ── File Renderers ─────────────────────────────────────────────────

/** File size formatter */
export const fileSizeRenderer = createReadOnlyRenderer((value) => {
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

// ── File Type Badge ────────────────────────────────────────────────

const FILE_TYPE_COLORS: Record<string, string> = {
    image: styles.cellEnumBlue,
    video: styles.cellEnumPurple,
    pdf: styles.cellEnumRed,
    document: styles.cellEnumGreen,
    other: styles.cellEnumGray,
};

/** File type output - colored badge with emoji */
export const fileTypeRenderer = createReadOnlyRenderer((value) =>
    outputEnumBadge(value, FILE_TYPE_OPTIONS_SHARED, FILE_TYPE_COLORS, styles.cellEnum));