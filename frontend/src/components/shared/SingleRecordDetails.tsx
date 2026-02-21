'use client';
import React from 'react';

import { resolveColumnConfig } from '@/constants/columnRegistry';
import type { ColumnConfig } from '@/constants/columnRegistry';
import styles from '@/components/styles/shared.module.css';

// ── Types ───────────────────────────────────────────────────────────

interface FieldOverride {
    key: string;
    label?: string;
    render?: (value: unknown) => React.ReactNode;
    input?: (value: unknown, onChange: (v: unknown) => void) => React.ReactNode;
    hidden?: boolean;
    readonly?: boolean;
    required?: boolean;
    validate?: (value: unknown) => string | null;
}

interface SingleRecordDetailsProps {
    tableName: string;
    values: Record<string, unknown>;
    onChange: (key: string, value: unknown) => void;
    mode: 'view' | 'edit' | 'create';
    fieldOverrides?: FieldOverride[];
    hiddenFields?: string[];
}

interface ResolvedField {
    key: string;
    config: ColumnConfig;
}

// ── Helpers ─────────────────────────────────────────────────────────

const resolveFields = (
    tableName: string,
    keys: string[],
    hiddenFields: string[],
    fieldOverrides: FieldOverride[],
): ResolvedField[] => {
    const overrideMap = Object.fromEntries(
        fieldOverrides.map((f) => [f.key, f]),
    );

    return keys
        .map((key) => {
            const override = overrideMap[key];
            const config = resolveColumnConfig(tableName, key, override ?? {});
            return { key, config };
        })
        .filter(
            (field) =>
                !field.config.hidden && !hiddenFields.includes(field.key),
        );
};

const validateField = (config: ColumnConfig, value: unknown, mode: string): string | null =>
    (mode === 'edit' || mode === 'create') && config.required &&
    (value === null || value === undefined || value === '')
        ? 'Pole wymagane'
        : config.validate
            ? config.validate(value)
            : null;

// ── Auto-deduced inputs ─────────────────────────────────────────────

const autoInput = (
    key: string,
    value: unknown,
    onChange: (v: unknown) => void,
): React.ReactNode => {
    const strValue = value === null || value === undefined ? '' : String(value);

    return typeof value === 'boolean' ? (
        <input
            id={key}
            type="checkbox"
            checked={value}
            onChange={(e) => onChange(e.target.checked)}
            className={styles.detailsCheckbox}
        />
    ) : typeof value === 'number' ? (
        <input
            id={key}
            type="number"
            value={strValue}
            onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
            className={styles.detailsInput}
        />
    ) : key.endsWith('_date') ? (
        <input
            id={key}
            type="date"
            value={strValue}
            onChange={(e) => onChange(e.target.value || null)}
            className={styles.detailsInput}
        />
    ) : key.endsWith('_at') ? (
        <input
            id={key}
            type="datetime-local"
            value={strValue}
            onChange={(e) => onChange(e.target.value || null)}
            className={styles.detailsInput}
        />
    ) : key === 'notes' || key === 'description' ? (
        <textarea
            id={key}
            value={strValue}
            onChange={(e) => onChange(e.target.value)}
            className={`${styles.detailsInput} ${styles.detailsTextarea}`}
            rows={3}
        />
    ) : (
        <input
            id={key}
            type="text"
            value={strValue}
            onChange={(e) => onChange(e.target.value)}
            className={styles.detailsInput}
        />
    );
};

// ── View mode value renderer ────────────────────────────────────────

const renderViewValue = (config: ColumnConfig, value: unknown): React.ReactNode =>
    config.render
        ? config.render(value)
        : value === null || value === undefined
            ? '—'
            : typeof value === 'boolean'
                ? (value ? 'Tak' : 'Nie')
                : String(value);

// ── Field Component ─────────────────────────────────────────────────

interface FieldProps {
    field: ResolvedField;
    value: unknown;
    onChange: (v: unknown) => void;
    mode: 'view' | 'edit' | 'create';
}

const Field = ({ field, value, onChange, mode }: FieldProps) => {
    const { key, config } = field;
    const isEditable = (mode === 'edit' || mode === 'create') && !config.readonly;
    const error = isEditable ? validateField(config, value, mode) : null;

    const labelClassName = `${styles.detailsLabel}${
        isEditable && config.required ? ` ${styles.detailsLabelRequired}` : ''
    }`;

    return (
        <div className={styles.detailsField}>
            <label htmlFor={key} className={labelClassName}>
                {config.label ?? key}
            </label>

            {isEditable ? (
                <>
                    {config.input ? (
                        <div className={styles.detailsInput}>
                            {config.input(value, onChange)}
                        </div>
                    ) : (
                        autoInput(key, value, onChange)
                    )}
                    {error && (
                        <span className={styles.detailsError} role="alert">
                            {error}
                        </span>
                    )}
                </>
            ) : (
                <span className={styles.detailsValue}>
                    {renderViewValue(config, value)}
                </span>
            )}
        </div>
    );
};

// ── SingleRecordDetails Component ───────────────────────────────────

export const SingleRecordDetails = ({
    tableName,
    values,
    onChange,
    mode,
    fieldOverrides = [],
    hiddenFields = [],
}: SingleRecordDetailsProps) => {
    const keys = Object.keys(values);
    const fields = resolveFields(tableName, keys, hiddenFields, fieldOverrides);

    return (
        <fieldset className={styles.detailsFieldset}>
            <div className={styles.detailsGrid}>
                {fields.map((field) => (
                    <Field
                        key={field.key}
                        field={field}
                        value={values[field.key]}
                        onChange={(v) => onChange(field.key, v)}
                        mode={mode}
                    />
                ))}
            </div>
        </fieldset>
    );
};
