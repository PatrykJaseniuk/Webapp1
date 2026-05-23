'use client';
import type { FieldRendererFn } from './types';
import styles from '@/components/styles/inputRenderers.module.css';

// ── Formatters ─────────────────────────────────────────────────────

export const formatDate = (value: unknown): string =>
    typeof value === 'string' || value instanceof Date
        ? new Date(value as string | Date).toLocaleDateString('pl-PL')
        : '—';

export const formatDateTime = (value: unknown): string =>
    typeof value === 'string' || value instanceof Date
        ? new Date(value as string | Date).toLocaleString('pl-PL')
        : '—';

export const formatCurrency = (value: unknown): string => {
    const num = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
    return isNaN(num)
        ? '—'
        : new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(num);
};

// ── Helpers ────────────────────────────────────────────────────────

const displayValue = (value: unknown): string =>
    value === null || value === undefined ? '' : String(value);

const numberDisplayValue = (value: unknown): string | number =>
    value === null || value === undefined ? '' : (value as number);

const fieldClass = (mode: 'read' | 'edit'): string =>
    mode === 'edit' ? styles.inputEdit : styles.inputRead;

// ── Text Renderers ─────────────────────────────────────────────────

/** Text input */
export const textRenderer: FieldRendererFn = ({ value, mode, onChange }) => (
    <input
        type="text"
        className={`${styles.fieldInput} ${fieldClass(mode)}`}
        value={displayValue(value)}
        readOnly={mode === 'read'}
        tabIndex={mode === 'read' ? -1 : undefined}
        onChange={mode === 'edit' ? (e) => onChange?.(e.target.value || null) : undefined}
        placeholder="Wprowadź wartość"
    />
);

/** Required text input with validation */
export const textRequiredRenderer: FieldRendererFn = ({ value, mode, onChange }) => {
    const hasValue = value !== null && value !== undefined && String(value).trim() !== '';
    return (
        <div className={styles.inputWrapper}>
            <input
                type="text"
                className={`${styles.fieldInput} ${fieldClass(mode)} ${!hasValue && mode === 'edit' ? styles.inputError : ''}`}
                value={displayValue(value)}
                readOnly={mode === 'read'}
                tabIndex={mode === 'read' ? -1 : undefined}
                onChange={mode === 'edit' ? (e) => onChange?.(e.target.value || null) : undefined}
                placeholder="Wymagane"
            />
            {!hasValue && mode === 'edit' && <span className={styles.inputErrorMsg}>Pole wymagane</span>}
        </div>
    );
};

/** Email input with validation */
export const emailRenderer: FieldRendererFn = ({ value, mode, onChange }) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const strValue = displayValue(value);
    const isValid = strValue === '' || emailRegex.test(strValue);
    return (
        <div className={styles.inputWrapper}>
            <input
                type="email"
                className={`${styles.fieldInput} ${fieldClass(mode)} ${!isValid && mode === 'edit' ? styles.inputError : ''}`}
                value={strValue}
                readOnly={mode === 'read'}
                tabIndex={mode === 'read' ? -1 : undefined}
                onChange={mode === 'edit' ? (e) => onChange?.(e.target.value || null) : undefined}
                placeholder="email@przyklad.pl"
            />
            {!isValid && mode === 'edit' && <span className={styles.inputErrorMsg}>Nieprawidłowy adres email</span>}
        </div>
    );
};

/** Textarea input */
export const textareaRenderer: FieldRendererFn = ({ value, mode, onChange }) => (
    <textarea
        className={`${styles.fieldTextarea} ${fieldClass(mode)}`}
        value={displayValue(value)}
        readOnly={mode === 'read'}
        tabIndex={mode === 'read' ? -1 : undefined}
        onChange={mode === 'edit' ? (e) => onChange?.(e.target.value) : undefined}
        rows={3}
        placeholder="Wprowadź tekst..."
    />
);

// ── Number Renderers ───────────────────────────────────────────────

/** Number input */
export const numberRenderer: FieldRendererFn = ({ value, mode, onChange }) => (
    <input
        type="number"
        className={`${styles.fieldInput} ${fieldClass(mode)}`}
        value={numberDisplayValue(value)}
        readOnly={mode === 'read'}
        tabIndex={mode === 'read' ? -1 : undefined}
        onChange={mode === 'edit' ? (e) => onChange?.(e.target.value === '' ? null : Number(e.target.value)) : undefined}
        placeholder="0"
    />
);

/** Currency input with suffix */
export const currencyRenderer: FieldRendererFn = ({ value, mode, onChange }) => (
    <div className={styles.inputCurrencyWrapper}>
        <input
            type="number"
            className={`${styles.fieldCurrency} ${fieldClass(mode)}`}
            step="0.01"
            min="0"
            value={numberDisplayValue(value)}
            readOnly={mode === 'read'}
            tabIndex={mode === 'read' ? -1 : undefined}
            onChange={mode === 'edit' ? (e) => onChange?.(e.target.value === '' ? null : Number(e.target.value)) : undefined}
            placeholder="0.00"
        />
        <span className={styles.inputCurrencySuffix}>zł</span>
    </div>
);

// ── Date Renderers ─────────────────────────────────────────────────

/** Date input */
export const dateRenderer: FieldRendererFn = ({ value, mode, onChange }) => (
    <input
        type="date"
        className={`${styles.fieldInput} ${fieldClass(mode)}`}
        value={displayValue(value)}
        readOnly={mode === 'read'}
        tabIndex={mode === 'read' ? -1 : undefined}
        onChange={mode === 'edit' ? (e) => onChange?.(e.target.value || null) : undefined}
    />
);

/** DateTime input */
export const dateTimeRenderer: FieldRendererFn = ({ value, mode, onChange }) => (
    <input
        type="datetime-local"
        className={`${styles.fieldInput} ${fieldClass(mode)}`}
        value={displayValue(value)}
        readOnly={mode === 'read'}
        tabIndex={mode === 'read' ? -1 : undefined}
        onChange={mode === 'edit' ? (e) => onChange?.(e.target.value || null) : undefined}
    />
);

// ── Boolean Input ─────────────────────────────────────────────────

/** Boolean checkbox input */
export const booleanRenderer: FieldRendererFn = ({ value, mode, onChange }) => (
    <label className={styles.inputCheckboxLabel}>
        <input
            type="checkbox"
            className={styles.inputCheckbox}
            checked={value === true}
            disabled={mode === 'read'}
            tabIndex={mode === 'read' ? -1 : undefined}
            onChange={mode === 'edit' ? (e) => onChange?.(e.target.checked) : undefined}
        />
        <span className={styles.inputCheckboxText}>{value === true ? 'Tak' : 'Nie'}</span>
    </label>
);

// ── Enum / Select Inputs ──────────────────────────────────────────

/** Generic select input from options map */
const inputSelect = (
    options: Record<string, string>,
    placeholder: string,
): FieldRendererFn => ({ value, mode, onChange }) => (
    <select
        className={`${styles.fieldInput} ${styles.fieldSelect} ${fieldClass(mode)}`}
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

const PROPERTY_TYPE_OPTIONS: Record<string, string> = {
    apartment: '🏠 Mieszkanie',
    house: '🏡 Dom',
    commercial: '🏢 Lokal usługowy',
    room: '🛏️ Pokój',
};

const PROPERTY_STATUS_OPTIONS: Record<string, string> = {
    available: 'Dostępna',
    occupied: 'Zajęta',
    inactive: 'Nieaktywna',
};

const TENANT_STATUS_OPTIONS: Record<string, string> = {
    active: 'Aktywny',
    past: 'Były',
    applicant: 'Kandydat',
};

const LEASE_STATUS_OPTIONS: Record<string, string> = {
    active: 'Aktywna',
    expired: 'Wygasła',
    terminated: 'Rozwiązana',
};

const TRANSACTION_TYPE_OPTIONS: Record<string, string> = {
    rent: '💰 Czynsz',
    utility: '💡 Media',
    expense: '📤 Wydatek',
    payment: '💳 Wpłata',
    withdraw: '🏧 Wypłata',
    fee: '📋 Opłata',
    other: '📎 Inne',
};

const TRANSACTION_STATUS_OPTIONS: Record<string, string> = {
    pending: 'Oczekująca',
    paid: 'Opłacona',
    overdue: 'Zaległa',
};

const FILE_TYPE_OPTIONS: Record<string, string> = {
    image: '🖼️ Obraz',
    video: '🎥 Wideo',
    pdf: '📄 PDF',
    document: '📝 Dokument',
    other: '📎 Inny',
};

// ── Enum Select Renderers ─────────────────────────────────────────

/** Property type select */
export const propertyTypeRenderer = inputSelect(PROPERTY_TYPE_OPTIONS, 'Wybierz typ...');

/** Property status select */
export const propertyStatusRenderer = inputSelect(PROPERTY_STATUS_OPTIONS, 'Wybierz status...');

/** Tenant status select */
export const tenantStatusRenderer = inputSelect(TENANT_STATUS_OPTIONS, 'Wybierz status...');

/** Lease status select */
export const leaseStatusRenderer = inputSelect(LEASE_STATUS_OPTIONS, 'Wybierz status...');

/** Transaction type select */
export const transactionTypeRenderer = inputSelect(TRANSACTION_TYPE_OPTIONS, 'Wybierz typ...');

/** Transaction status select */
export const transactionStatusRenderer = inputSelect(TRANSACTION_STATUS_OPTIONS, 'Wybierz status...');

// Re-export for computedRenderers
export const FILE_TYPE_OPTIONS_SHARED = FILE_TYPE_OPTIONS;