'use client';
import type React from 'react';
import type { FieldRendererFn } from './types';
import styles from '@/components/styles/basicRenderers.module.css';
import computedStyles from '@/components/styles/computedRenderers.module.css';

// ── Helpers ────────────────────────────────────────────────────────

const displayValue = (value: unknown): string =>
    value === null || value === undefined ? '' : String(value);

const numberDisplayValue = (value: unknown): string | number =>
    value === null || value === undefined ? '' : (value as number);

// ── Text Renderer ──────────────────────────────────────────────────

/** Text input */
export const textRenderer: FieldRendererFn = ({ value, mode, onChange }) => (
    <input
        type="text"
        className={mode === 'edit' ? styles.textRendererEdit : styles.textRendererRead}
        value={displayValue(value)}
        readOnly={mode === 'read'}
        tabIndex={mode === 'read' ? -1 : undefined}
        onChange={mode === 'edit' ? (e) => onChange?.(e.target.value || null) : undefined}
        placeholder="Wprowadź wartość"
    />
);

// ── Text Required Renderer ─────────────────────────────────────────

/** Required text input with validation */
export const textRequiredRenderer: FieldRendererFn = ({ value, mode, onChange }) => {
    const hasValue = value !== null && value !== undefined && String(value).trim() !== '';
    return (
        <div className={styles.textRequiredWrapper}>
            <input
                type="text"
                className={`${styles.textRequiredRendererEdit} ${!hasValue && mode === 'edit' ? styles.textRequiredError : ''}`}
                value={displayValue(value)}
                readOnly={mode === 'read'}
                tabIndex={mode === 'read' ? -1 : undefined}
                onChange={mode === 'edit' ? (e) => onChange?.(e.target.value || null) : undefined}
                placeholder="Wymagane"
            />
            {!hasValue && mode === 'edit' && <span className={styles.textRequiredErrorMsg}>Pole wymagane</span>}
        </div>
    );
};

// ── Email Renderer ─────────────────────────────────────────────────

/** Email input with validation */
export const emailRenderer: FieldRendererFn = ({ value, mode, onChange }) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const strValue = displayValue(value);
    const isValid = strValue === '' || emailRegex.test(strValue);
    return (
        <div className={styles.emailWrapper}>
            <input
                type="email"
                className={`${styles.emailRendererEdit} ${!isValid && mode === 'edit' ? styles.emailError : ''}`}
                value={strValue}
                readOnly={mode === 'read'}
                tabIndex={mode === 'read' ? -1 : undefined}
                onChange={mode === 'edit' ? (e) => onChange?.(e.target.value || null) : undefined}
                placeholder="email@przyklad.pl"
            />
            {!isValid && mode === 'edit' && <span className={styles.emailErrorMsg}>Nieprawidłowy adres email</span>}
        </div>
    );
};

// ── Textarea Renderer ──────────────────────────────────────────────

/** Textarea input */
export const textareaRenderer: FieldRendererFn = ({ value, mode, onChange }) => (
    <textarea
        className={mode === 'edit' ? styles.textareaRendererEdit : styles.textareaRendererRead}
        value={displayValue(value)}
        readOnly={mode === 'read'}
        tabIndex={mode === 'read' ? -1 : undefined}
        onChange={mode === 'edit' ? (e) => onChange?.(e.target.value) : undefined}
        rows={3}
        placeholder="Wprowadź tekst..."
    />
);

// ── Number Renderer ────────────────────────────────────────────────

/** Number input */
export const numberRenderer: FieldRendererFn = ({ value, mode, onChange }) => (
    <input
        type="number"
        className={mode === 'edit' ? styles.numberRendererEdit : styles.numberRendererRead}
        value={numberDisplayValue(value)}
        readOnly={mode === 'read'}
        tabIndex={mode === 'read' ? -1 : undefined}
        onChange={mode === 'edit' ? (e) => onChange?.(e.target.value === '' ? null : Number(e.target.value)) : undefined}
        placeholder="0"
    />
);

// ── Currency Renderer ──────────────────────────────────────────────

/** Currency input with suffix */
export const currencyRenderer: FieldRendererFn = ({ value, mode, onChange }) => (
    <div className={styles.currencyWrapper}>
        <input
            type="number"
            className={mode === 'edit' ? styles.currencyRendererEdit : styles.currencyRendererRead}
            step="0.01"
            min="0"
            value={numberDisplayValue(value)}
            readOnly={mode === 'read'}
            tabIndex={mode === 'read' ? -1 : undefined}
            onChange={mode === 'edit' ? (e) => onChange?.(e.target.value === '' ? null : Number(e.target.value)) : undefined}
            placeholder="0.00"
        />
        <span className={styles.currencySuffix}>zł</span>
    </div>
);

// ── Date Renderer ──────────────────────────────────────────────────

/** Date input */
export const dateRenderer: FieldRendererFn = ({ value, mode, onChange }) => (
    <input
        type="date"
        className={mode === 'edit' ? styles.dateRendererEdit : styles.dateRendererRead}
        value={displayValue(value)}
        readOnly={mode === 'read'}
        tabIndex={mode === 'read' ? -1 : undefined}
        onChange={mode === 'edit' ? (e) => onChange?.(e.target.value || null) : undefined}
    />
);

// ── DateTime Renderer ──────────────────────────────────────────────

/** DateTime input */
export const dateTimeRenderer: FieldRendererFn = ({ value, mode, onChange }) => (
    <input
        type="datetime-local"
        className={mode === 'edit' ? styles.dateTimeRendererEdit : styles.dateTimeRendererRead}
        value={displayValue(value)}
        readOnly={mode === 'read'}
        tabIndex={mode === 'read' ? -1 : undefined}
        onChange={mode === 'edit' ? (e) => onChange?.(e.target.value || null) : undefined}
    />
);

// ── Boolean Renderer ───────────────────────────────────────────────

/** Boolean checkbox input */
export const booleanRenderer: FieldRendererFn = ({ value, mode, onChange }) => (
    <label className={mode === 'edit' ? styles.booleanRendererEdit : styles.booleanRendererRead}>
        <input
            type="checkbox"
            className={styles.checkboxInput}
            checked={value === true}
            disabled={mode === 'read'}
            tabIndex={mode === 'read' ? -1 : undefined}
            onChange={mode === 'edit' ? (e) => onChange?.(e.target.checked) : undefined}
        />
        <span className={styles.checkboxText}>{value === true ? 'Tak' : 'Nie'}</span>
    </label>
);

// ── Enum / Select Inputs ──────────────────────────────────────────

/** Generic select input from options map */
export const enumRendererGenerator = (
    options: Record<string, string>,
    placeholder: string,
): FieldRendererFn => ({ value, mode, onChange }) => (
    <select
        className={mode === 'edit' ? styles.selectRendererEdit : styles.selectRendererRead}
        value={displayValue(value)}
        disabled={mode === 'read'}
        tabIndex={mode === 'read' ? -1 : undefined}
        onChange={mode === 'edit' ? (e) => onChange?.(e.target.value || null) : undefined}
    >
        <option value="">{placeholder}</option>
        {Object.entries(options).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
        ))}
    </select>
);

// ── Enum Options ──────────────────────────────────────────────────

// ── Computed Renderers ──────────────────────────────────────────────

/** Helper for null display */
const outputNull = (): React.ReactNode => <span className={computedStyles.nullRenderer}>—</span>;

/** Create a read-only renderer */
const createReadOnlyRenderer = (render: (value: unknown) => React.ReactNode): FieldRendererFn =>
    ({ value }) => render(value);

// ── Computed Number Renderers ──────────────────────────────────────

/** Days count output with urgency colors (for days_until_end, days_active) */
export const daysCountRenderer = createReadOnlyRenderer((value) => {
    const numValue = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
    const colorClass = isNaN(numValue)
        ? ''
        : numValue < 0
            ? computedStyles.daysCountOverdueRenderer
            : numValue <= 7
                ? computedStyles.daysCountWarningRenderer
                : numValue <= 30
                    ? computedStyles.daysCountNormalRenderer
                    : computedStyles.daysCountSafeRenderer;
    const className = colorClass ? computedStyles.numberRenderer + ' ' + colorClass : computedStyles.numberRenderer;
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
            ? computedStyles.itemCountGoodRenderer
            : numValue <= 3
                ? computedStyles.itemCountWarningRenderer
                : computedStyles.itemCountCriticalRenderer;
    const className = colorClass ? computedStyles.numberRenderer + ' ' + colorClass : computedStyles.numberRenderer;
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
        : <span className={computedStyles.fileSizeRenderer}>
            {num < 1024
                ? num + ' B'
                : num < 1024 * 1024
                    ? (num / 1024).toFixed(1) + ' KB'
                    : (num / (1024 * 1024)).toFixed(1) + ' MB'}
        </span>;
});

// ── File Type Badge Factory ────────────────────────────────────────

/** Create a file type badge renderer with custom label/color options */
export const FileTypeRendererGenerator = (
    options: Record<string, { label: string; color: string }>,
): FieldRendererFn =>
    ({ value }) => {
        const key = value === null || value === undefined ? '' : String(value);
        const option = options[key] ?? { label: key, color: '' };
        const className = option.color
            ? computedStyles.enumRenderer + ' ' + option.color
            : computedStyles.enumRenderer;
        return value === null || value === undefined
            ? outputNull()
            : <span className={className}>{option.label}</span>;
    };
