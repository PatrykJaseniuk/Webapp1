'use client';
import type React from 'react';
import type { ChangeEvent } from 'react';
import type { FieldRendererFn } from './types';
import styles from '@/components/styles/basicRenderers.module.css';
import computedStyles from '@/components/styles/computedRenderers.module.css';

type FieldMode = 'read' | 'edit';
type TextLikeType = 'text' | 'email' | 'date' | 'datetime-local' | 'number';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const displayValue = (value: unknown): string => value === null || value === undefined ? '' : String(value);
const numberDisplayValue = (value: unknown): string | number => value === null || value === undefined ? '' : Number(value);
const isBlank = (value: unknown): boolean => displayValue(value).trim() === '';
const joinClasses = (...classNames: readonly (string | false | null | undefined)[]): string => classNames.filter(Boolean).join(' ');
const getModeClass = (mode: FieldMode): string => mode === 'edit' ? styles.fieldEdit : styles.fieldRead;
const getInputProps = (mode: FieldMode) => ({ readOnly: mode === 'read', tabIndex: mode === 'read' ? -1 : undefined });
const getSelectProps = (mode: FieldMode) => ({ disabled: mode === 'read', tabIndex: mode === 'read' ? -1 : undefined });
const getChangeHandler = <T,>(
    mode: FieldMode,
    onChange: ((value: T) => void) | undefined,
    mapValue: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => T,
) => mode === 'edit' ? (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => onChange?.(mapValue(event)) : undefined;

const FieldShell = ({
    mode,
    invalid = false,
    message,
    children,
    className,
}: Readonly<{
    mode: FieldMode;
    invalid?: boolean;
    message?: string;
    children: React.ReactNode;
    className?: string;
}>) => (
    <div className={joinClasses(styles.fieldShell, className)}>
        <div className={joinClasses(styles.fieldFrame, getModeClass(mode), invalid && mode === 'edit' && styles.fieldInvalid)}>{children}</div>
        <span className={joinClasses(styles.fieldMessage, invalid && mode === 'edit' && styles.fieldMessageVisible)} aria-live="polite">
            {invalid && mode === 'edit' ? message : ' '}
        </span>
    </div>
);

const TextField = ({
    value,
    mode,
    onChange,
    type = 'text',
    placeholder,
    multiline = false,
    rows = 3,
    invalid = false,
    message,
    step,
    min,
}: Readonly<{
    value: unknown;
    mode: FieldMode;
    onChange?: (value: unknown) => void;
    type?: TextLikeType;
    placeholder?: string;
    multiline?: boolean;
    rows?: number;
    invalid?: boolean;
    message?: string;
    step?: string;
    min?: string;
}>) => {
    const currentValue = type === 'number' ? numberDisplayValue(value) : displayValue(value);
    return (
        <FieldShell mode={mode} invalid={invalid} message={message}>
            {multiline
                ? <textarea
                    className={joinClasses(styles.fieldControl, styles.fieldTextarea)}
                    value={displayValue(value)}
                    placeholder={placeholder}
                    rows={rows}
                    {...getInputProps(mode)}
                    onChange={getChangeHandler(mode, onChange, (event) => event.target.value)}
                />
                : <input
                    type={type}
                    className={joinClasses(styles.fieldControl, type === 'number' && styles.fieldNumeric)}
                    value={currentValue}
                    placeholder={placeholder}
                    step={step}
                    min={min}
                    {...getInputProps(mode)}
                    onChange={getChangeHandler(mode, onChange, (event) =>
                        type === 'number'
                            ? event.target.value === '' ? null : Number(event.target.value)
                            : event.target.value || null,
                    )}
                />}
        </FieldShell>
    );
};

export const textRenderer: FieldRendererFn = ({ value, mode, onChange }) => (
    <TextField value={value} mode={mode} onChange={onChange} placeholder="Wprowadź wartość" />
);

export const textRequiredRenderer: FieldRendererFn = ({ value, mode, onChange }) => (
    <TextField value={value} mode={mode} onChange={onChange} placeholder="Wymagane" invalid={isBlank(value)} message="Pole wymagane" />
);

export const emailRenderer: FieldRendererFn = ({ value, mode, onChange }) => {
    const currentValue = displayValue(value);
    return (
        <TextField
            value={value}
            mode={mode}
            onChange={onChange}
            type="email"
            placeholder="email@przyklad.pl"
            invalid={currentValue !== '' && !EMAIL_REGEX.test(currentValue)}
            message="Nieprawidłowy adres email"
        />
    );
};

export const textareaRenderer: FieldRendererFn = ({ value, mode, onChange }) => (
    <TextField value={value} mode={mode} onChange={onChange} multiline rows={3} placeholder="Wprowadź tekst..." />
);

export const numberRenderer: FieldRendererFn = ({ value, mode, onChange }) => (
    <TextField value={value} mode={mode} onChange={onChange} type="number" placeholder="0" />
);

export const currencyRenderer: FieldRendererFn = ({ value, mode, onChange }) => (
    <FieldShell mode={mode} className={styles.currencyShell}>
        <div className={styles.currencyLayout}>
            <input
                type="number"
                className={joinClasses(styles.fieldControl, styles.fieldNumeric, styles.currencyInput)}
                step="0.01"
                min="0"
                value={numberDisplayValue(value)}
                placeholder="0.00"
                {...getInputProps(mode)}
                onChange={getChangeHandler(mode, onChange, (event) => event.target.value === '' ? null : Number(event.target.value))}
            />
            <span className={styles.currencySuffix}>zł</span>
        </div>
    </FieldShell>
);

export const dateRenderer: FieldRendererFn = ({ value, mode, onChange }) => (
    <TextField value={value} mode={mode} onChange={onChange} type="date" />
);

export const dateTimeRenderer: FieldRendererFn = ({ value, mode, onChange }) => (
    <TextField value={value} mode={mode} onChange={onChange} type="datetime-local" />
);

export const booleanRenderer: FieldRendererFn = ({ value, mode, onChange }) => (
    <FieldShell mode={mode} className={styles.booleanShell}>
        <label className={styles.booleanField}>
            <input
                type="checkbox"
                className={styles.checkboxInput}
                checked={value === true}
                disabled={mode === 'read'}
                tabIndex={mode === 'read' ? -1 : undefined}
                onChange={mode === 'edit' ? (event) => onChange?.(event.target.checked) : undefined}
            />
            <span className={styles.checkboxText}>{value === true ? 'Tak' : 'Nie'}</span>
        </label>
    </FieldShell>
);

export const enumRendererGenerator = (
    options: Record<string, string>,
    placeholder: string,
): FieldRendererFn => ({ value, mode, onChange }) => (
    <FieldShell mode={mode}>
        <select
            className={styles.selectControl}
            value={displayValue(value)}
            {...getSelectProps(mode)}
            onChange={getChangeHandler(mode, onChange, (event) => event.target.value || null)}
        >
            <option value="">{placeholder}</option>
            {Object.entries(options).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
    </FieldShell>
);

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
