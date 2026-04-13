'use client';

import { resolveFieldConfig } from '@/components/fieldRegistry';
import type { FieldConfig } from '@/components/fieldRegistry/types';
import styles from '@/components/styles/shared.module.css';
import inputStyles from '@/components/styles/inputRenderers.module.css';
import cellStyles from '@/components/styles/cellRenderers.module.css';

// ── Types ───────────────────────────────────────────────────────────

interface FieldOverrides {
    [key: string]: Partial<FieldConfig>;
}

interface SingleRecordEditProps {
    /** Current form values (controlled from parent) */
    values: Record<string, unknown>;
    
    /** Report field change to parent */
    onChange: (key: string, value: unknown) => void;
    
    /** Column overrides (per-usage config) */
    columns?: FieldOverrides;
    
    /** Columns to hide */
    hiddenColumns?: string[];
    
    /** Fields that are readonly in edit mode */
    readonlyFields?: string[];
    
    /** Submit handler (parent performs INSERT or UPDATE) */
    onSubmit: () => void;
    
    /** Cancel handler */
    onCancel: () => void;
    
    /** Button text (default: "Zapisz") */
    submitLabel?: string;
    
    /** Loading state */
    loading?: boolean;
}

interface ResolvedField {
    key: string;
    config: FieldConfig;
}

// ── Helpers ─────────────────────────────────────────────────────────

const resolveFields = (
    keys: string[],
    hiddenColumns: string[],
    fieldOverrides: FieldOverrides,
): ResolvedField[] =>
    keys
        .map((key) => ({
            key,
            config: resolveFieldConfig(key, fieldOverrides[key]),
        }))
        .filter((field) => !field.config.hidden && !hiddenColumns.includes(field.key));

const getFieldLabel = (field: ResolvedField): string =>
    field.config.label ?? field.key;

// ── Auto-deduced inputs (fallback when no fieldInput provided) ──────

const autoInput = (
    key: string,
    value: unknown,
    onChange: (v: unknown) => void,
): React.ReactNode => {
    const strValue = value === null || value === undefined ? '' : String(value);

    return typeof value === 'boolean'
        ? (
            <label className={inputStyles.inputCheckboxLabel}>
                <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => onChange(e.target.checked)}
                    className={inputStyles.inputCheckbox}
                />
                <span className={inputStyles.inputCheckboxText}>{value ? 'Tak' : 'Nie'}</span>
            </label>
        )
        : typeof value === 'number'
            ? (
                <input
                    type="number"
                    value={strValue}
                    onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
                    className={inputStyles.inputNumber}
                    placeholder="0"
                />
            )
            : key.endsWith('_date')
                ? (
                    <input
                        type="date"
                        value={strValue}
                        onChange={(e) => onChange(e.target.value || null)}
                        className={inputStyles.inputDate}
                    />
                )
                : key.endsWith('_at')
                    ? (
                        <input
                            type="datetime-local"
                            value={strValue}
                            onChange={(e) => onChange(e.target.value || null)}
                            className={inputStyles.inputDateTime}
                        />
                    )
                    : key === 'notes' || key === 'description'
                        ? (
                            <textarea
                                value={strValue}
                                onChange={(e) => onChange(e.target.value)}
                                className={inputStyles.inputTextarea}
                                rows={3}
                                placeholder="Wprowadź tekst..."
                            />
                        )
                        : (
                            <input
                                type="text"
                                value={strValue}
                                onChange={(e) => onChange(e.target.value || null)}
                                className={inputStyles.inputText}
                                placeholder="Wprowadź wartość"
                            />
                        );
};

// ── Field Component ─────────────────────────────────────────────────

interface FieldProps {
    field: ResolvedField;
    value: unknown;
    onChange: (v: unknown) => void;
    readonly: boolean;
    row: Record<string, unknown>;
}

const Field = ({ field, value, onChange, readonly, row }: FieldProps) => {
    const { key, config } = field;
    const isReadonly = readonly || !config.fieldInput;

    return (
        <div className={styles.detailsField}>
            <label htmlFor={key} className={styles.detailsLabel}>
                {getFieldLabel(field)}
            </label>

            {isReadonly
                ? <span className={styles.detailsValue}>
                    {config.fieldOutput
                        ? config.fieldOutput(value, row)
                        : value === null || value === undefined
                            ? <span className={cellStyles.cellNull}>—</span>
                            : typeof value === 'boolean'
                                ? <span className={cellStyles.cellBoolean + ' ' + (value ? cellStyles.cellBooleanTrue : cellStyles.cellBooleanFalse)}>
                                    {value ? '✓ Tak' : '✗ Nie'}
                                </span>
                                : String(value)}
                </span>
                : config.fieldInput
                    ? config.fieldInput(value, onChange)
                    : autoInput(key, value, onChange)}
        </div>
    );
};

// ── SingleRecordEdit Component ──────────────────────────────────────

export const SingleRecordEdit = ({
    values,
    onChange,
    columns: fieldOverrides = {},
    hiddenColumns = [],
    readonlyFields = [],
    onSubmit,
    onCancel,
    submitLabel = 'Zapisz',
    loading = false,
}: SingleRecordEditProps) => {
    // Resolve fields (only scalar fields)
    const keys = Object.keys(values).filter((key) => {
        const value = values[key];
        return typeof value !== 'object' || value === null;
    });
    const resolvedFields = resolveFields(keys, hiddenColumns, fieldOverrides);

    // Handle form submit
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit();
    };

    return (
        <form onSubmit={handleSubmit} className={styles.detailsForm}>
            <fieldset className={styles.detailsFieldset}>
                <div className={styles.detailsGrid}>
                    {resolvedFields.map((field) => (
                        <Field
                            key={field.key}
                            field={field}
                            value={values[field.key]}
                            onChange={(v) => onChange(field.key, v)}
                            readonly={readonlyFields.includes(field.key)}
                            row={values}
                        />
                    ))}
                </div>
            </fieldset>

            <div className={styles.detailsActions}>
                <button
                    type="submit"
                    className={styles.buttonPrimary}
                    disabled={loading}
                >
                    {loading ? 'Zapisuję...' : submitLabel}
                </button>
                <button
                    type="button"
                    className={styles.buttonSecondary}
                    onClick={onCancel}
                    disabled={loading}
                >
                    Anuluj
                </button>
            </div>
        </form>
    );
};