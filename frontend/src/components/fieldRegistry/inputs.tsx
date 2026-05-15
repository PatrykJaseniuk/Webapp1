'use client';
import type { FieldRendererFn } from './types';
import styles from '@/components/styles/inputRenderers.module.css';

const renderReadText = (value: unknown): string =>
    value === null || value === undefined ? '' : String(value);

// ── Text Inputs ───────────────────────────────────────────────────────

/** Text input */
export const inputText: FieldRendererFn = ({ value, mode, onChange }) => (
    mode === 'edit' ?
        <input
            type="text"
            className={styles.inputText}
            value={(value as string) ?? ''}
            onChange={(e) => onChange?.(e.target.value || null)}
            placeholder="Wprowadź wartość"
        /> :
        <span>{renderReadText(value)}</span>
);

/** Required text input with validation */
export const inputTextRequired: FieldRendererFn = ({ value, mode, onChange }) => {
    const hasValue = value !== null && value !== undefined && String(value).trim() !== '';
    return (
        mode === 'edit' ?
            <div className={styles.inputWrapper}>
                <input
                    type="text"
                    className={`${styles.inputText} ${!hasValue ? styles.inputError : ''}`}
                    value={(value as string) ?? ''}
                    onChange={(e) => onChange?.(e.target.value || null)}
                    placeholder="Wymagane"
                />
                {!hasValue && <span className={styles.inputErrorMsg}>Pole wymagane</span>}
            </div> :
            <span>{renderReadText(value)}</span>
    );
};

/** Email input with validation */
export const inputEmail: FieldRendererFn = ({ value, mode, onChange }) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const strValue = (value as string) ?? '';
    const isValid = strValue === '' || emailRegex.test(strValue);
    return (
        mode === 'edit' ?
            <div className={styles.inputWrapper}>
                <input
                    type="email"
                    className={`${styles.inputText} ${!isValid ? styles.inputError : ''}`}
                    value={strValue}
                    onChange={(e) => onChange?.(e.target.value || null)}
                    placeholder="email@przyklad.pl"
                />
                {!isValid && <span className={styles.inputErrorMsg}>Nieprawidłowy adres email</span>}
            </div> :
            <span>{renderReadText(value)}</span>
    );
};

/** Textarea input */
export const inputTextarea: FieldRendererFn = ({ value, mode, onChange }) => (
    mode === 'edit' ?
        <textarea
            className={styles.inputTextarea}
            value={(value as string) ?? ''}
            onChange={(e) => onChange?.(e.target.value)}
            rows={3}
            placeholder="Wprowadź tekst..."
        /> :
        <span>{renderReadText(value)}</span>
);

// ── Number Inputs ─────────────────────────────────────────────────────

/** Number input */
export const inputNumber: FieldRendererFn = ({ value, mode, onChange }) => (
    mode === 'edit' ?
        <input
            type="number"
            className={styles.inputNumber}
            value={(value as number) ?? ''}
            onChange={(e) => onChange?.(e.target.value === '' ? null : Number(e.target.value))}
            placeholder="0"
        /> :
        <span>{renderReadText(value)}</span>
);

/** Currency input with suffix */
export const inputCurrency: FieldRendererFn = ({ value, mode, onChange }) => (
    mode === 'edit' ?
        <div className={styles.inputCurrencyWrapper}>
            <input
                type="number"
                className={styles.inputCurrency}
                step="0.01"
                min="0"
                value={(value as number) ?? ''}
                onChange={(e) => onChange?.(e.target.value === '' ? null : Number(e.target.value))}
                placeholder="0.00"
            />
            <span className={styles.inputCurrencySuffix}>zł</span>
        </div> :
        <span>{renderReadText(value)}</span>
);

// ── Date Inputs ───────────────────────────────────────────────────────

/** Date input */
export const inputDate: FieldRendererFn = ({ value, mode, onChange }) => (
    mode === 'edit' ?
        <input
            type="date"
            className={styles.inputDate}
            value={(value as string) ?? ''}
            onChange={(e) => onChange?.(e.target.value || null)}
        /> :
        <span>{renderReadText(value)}</span>
);

/** DateTime input */
export const inputDateTime: FieldRendererFn = ({ value, mode, onChange }) => (
    mode === 'edit' ?
        <input
            type="datetime-local"
            className={styles.inputDateTime}
            value={(value as string) ?? ''}
            onChange={(e) => onChange?.(e.target.value || null)}
        /> :
        <span>{renderReadText(value)}</span>
);

// ── Boolean Input ─────────────────────────────────────────────────────

/** Boolean checkbox input */
export const inputBoolean: FieldRendererFn = ({ value, mode, onChange }) => (
    mode === 'edit' ?
        <label className={styles.inputCheckboxLabel}>
            <input
                type="checkbox"
                className={styles.inputCheckbox}
                checked={value === true}
                onChange={(e) => onChange?.(e.target.checked)}
            />
            <span className={styles.inputCheckboxText}>{value === true ? 'Tak' : 'Nie'}</span>
        </label> :
        <span>{value === true ? 'Tak' : 'Nie'}</span>
);

// ── Enum / Select Inputs ──────────────────────────────────────────────

/** Generic select input from options map */
const inputSelect = (
    options: Record<string, string>,
    placeholder: string,
): FieldRendererFn => ({ value, mode, onChange }) => (
    mode === 'edit' ?
        <select
            className={styles.inputSelect}
            value={(value as string) ?? ''}
            onChange={(e) => onChange?.(e.target.value || null)}
        >
            <option value="">{placeholder}</option>
            {Object.entries(options).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
            ))}
        </select> :
        <span>{options[String(value ?? '')] ?? renderReadText(value)}</span>
);

/** Property type select */
export const inputPropertyType = inputSelect(
    { apartment: '🏠 Mieszkanie', house: '🏡 Dom', commercial: '🏢 Lokal usługowy', room: '🛏️ Pokój' },
    'Wybierz typ...',
);

/** Property status select */
export const inputPropertyStatus = inputSelect(
    { available: 'Dostępna', occupied: 'Zajęta', inactive: 'Nieaktywna' },
    'Wybierz status...',
);

/** Tenant status select */
export const inputTenantStatus = inputSelect(
    { active: 'Aktywny', past: 'Były', applicant: 'Kandydat' },
    'Wybierz status...',
);

/** Lease status select */
export const inputLeaseStatus = inputSelect(
    { active: 'Aktywna', expired: 'Wygasła', terminated: 'Rozwiązana' },
    'Wybierz status...',
);

/** Transaction type select */
export const inputTransactionType = inputSelect(
    { rent: '💰 Czynsz', utility: '💡 Media', expense: '📤 Wydatek', payment: '💳 Wpłata', withdraw: '🏧 Wypłata', fee: '📋 Opłata', other: '📎 Inne' },
    'Wybierz typ...',
);

/** Transaction status select */
export const inputTransactionStatus = inputSelect(
    { pending: 'Oczekująca', paid: 'Opłacona', overdue: 'Zaległa' },
    'Wybierz status...',
);
