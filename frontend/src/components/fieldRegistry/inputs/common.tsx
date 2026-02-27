'use client';
import type { FieldInputFn } from '../types';
import styles from '@/components/styles/inputRenderers.module.css';

// ── Text Inputs ───────────────────────────────────────────────────────

/** Text input */
export const inputText: FieldInputFn = (value, onChange) => (
    <input
        type="text"
        className={styles.inputText}
        value={(value as string) ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        placeholder="Wprowadź wartość"
    />
);

/** Required text input with validation */
export const inputTextRequired: FieldInputFn = (value, onChange) => {
    const hasValue = value !== null && value !== undefined && String(value).trim() !== '';
    return (
        <div className={styles.inputWrapper}>
            <input
                type="text"
                className={`${styles.inputText} ${!hasValue ? styles.inputError : ''}`}
                value={(value as string) ?? ''}
                onChange={(e) => onChange(e.target.value || null)}
                placeholder="Wymagane"
            />
            {!hasValue && <span className={styles.inputErrorMsg}>Pole wymagane</span>}
        </div>
    );
};

/** Email input with validation */
export const inputEmail: FieldInputFn = (value, onChange) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const strValue = (value as string) ?? '';
    const isValid = strValue === '' || emailRegex.test(strValue);
    return (
        <div className={styles.inputWrapper}>
            <input
                type="email"
                className={`${styles.inputText} ${!isValid ? styles.inputError : ''}`}
                value={strValue}
                onChange={(e) => onChange(e.target.value || null)}
                placeholder="email@przyklad.pl"
            />
            {!isValid && <span className={styles.inputErrorMsg}>Nieprawidłowy adres email</span>}
        </div>
    );
};

/** Textarea input */
export const inputTextarea: FieldInputFn = (value, onChange) => (
    <textarea
        className={styles.inputTextarea}
        value={(value as string) ?? ''}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder="Wprowadź tekst..."
    />
);

// ── Number Inputs ─────────────────────────────────────────────────────

/** Number input */
export const inputNumber: FieldInputFn = (value, onChange) => (
    <input
        type="number"
        className={styles.inputNumber}
        value={(value as number) ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        placeholder="0"
    />
);

/** Currency input with suffix */
export const inputCurrency: FieldInputFn = (value, onChange) => (
    <div className={styles.inputCurrencyWrapper}>
        <input
            type="number"
            className={styles.inputCurrency}
            step="0.01"
            min="0"
            value={(value as number) ?? ''}
            onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
            placeholder="0.00"
        />
        <span className={styles.inputCurrencySuffix}>zł</span>
    </div>
);

// ── Date Inputs ───────────────────────────────────────────────────────

/** Date input */
export const inputDate: FieldInputFn = (value, onChange) => (
    <input
        type="date"
        className={styles.inputDate}
        value={(value as string) ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
    />
);

/** DateTime input */
export const inputDateTime: FieldInputFn = (value, onChange) => (
    <input
        type="datetime-local"
        className={styles.inputDateTime}
        value={(value as string) ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
    />
);

// ── Boolean Input ─────────────────────────────────────────────────────

/** Boolean checkbox input */
export const inputBoolean: FieldInputFn = (value, onChange) => (
    <label className={styles.inputCheckboxLabel}>
        <input
            type="checkbox"
            className={styles.inputCheckbox}
            checked={value === true}
            onChange={(e) => onChange(e.target.checked)}
        />
        <span className={styles.inputCheckboxText}>{value === true ? 'Tak' : 'Nie'}</span>
    </label>
);