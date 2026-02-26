'use client';
import type { FieldInputFn } from '../types';

// ── Text Inputs ───────────────────────────────────────────────────────

/** Text input */
export const inputText: FieldInputFn = (value, onChange) => (
    <input
        type="text"
        className="inputText"
        value={(value as string) ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        placeholder="Wprowadź wartość"
    />
);

/** Required text input with validation */
export const inputTextRequired: FieldInputFn = (value, onChange) => {
    const hasValue = value !== null && value !== undefined && String(value).trim() !== '';
    return (
        <div className="inputWrapper">
            <input
                type="text"
                className={`inputText ${!hasValue ? 'inputError' : ''}`}
                value={(value as string) ?? ''}
                onChange={(e) => onChange(e.target.value || null)}
                placeholder="Wymagane"
            />
            {!hasValue && <span className="inputErrorMsg">Pole wymagane</span>}
        </div>
    );
};

/** Email input with validation */
export const inputEmail: FieldInputFn = (value, onChange) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const strValue = (value as string) ?? '';
    const isValid = strValue === '' || emailRegex.test(strValue);
    return (
        <div className="inputWrapper">
            <input
                type="email"
                className={`inputText ${!isValid ? 'inputError' : ''}`}
                value={strValue}
                onChange={(e) => onChange(e.target.value || null)}
                placeholder="email@przyklad.pl"
            />
            {!isValid && <span className="inputErrorMsg">Nieprawidłowy adres email</span>}
        </div>
    );
};

/** Textarea input */
export const inputTextarea: FieldInputFn = (value, onChange) => (
    <textarea
        className="inputTextarea"
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
        className="inputNumber"
        value={(value as number) ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        placeholder="0"
    />
);

/** Currency input with suffix */
export const inputCurrency: FieldInputFn = (value, onChange) => (
    <div className="inputCurrencyWrapper">
        <input
            type="number"
            className="inputCurrency"
            step="0.01"
            min="0"
            value={(value as number) ?? ''}
            onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
            placeholder="0.00"
        />
        <span className="inputCurrencySuffix">zł</span>
    </div>
);

// ── Date Inputs ───────────────────────────────────────────────────────

/** Date input */
export const inputDate: FieldInputFn = (value, onChange) => (
    <input
        type="date"
        className="inputDate"
        value={(value as string) ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
    />
);

/** DateTime input */
export const inputDateTime: FieldInputFn = (value, onChange) => (
    <input
        type="datetime-local"
        className="inputDateTime"
        value={(value as string) ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
    />
);

// ── Boolean Input ─────────────────────────────────────────────────────

/** Boolean checkbox input */
export const inputBoolean: FieldInputFn = (value, onChange) => (
    <label className="inputCheckboxLabel">
        <input
            type="checkbox"
            className="inputCheckbox"
            checked={value === true}
            onChange={(e) => onChange(e.target.checked)}
        />
        <span className="inputCheckboxText">{value === true ? 'Tak' : 'Nie'}</span>
    </label>
);