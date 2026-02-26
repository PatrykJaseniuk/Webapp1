'use client';
import React from 'react';

import { resolveFieldConfig } from '@/fieldRegistry';
import type { FieldConfig } from '@/fieldRegistry';
import styles from '@/components/styles/shared.module.css';

// ── Types ───────────────────────────────────────────────────────────

interface FieldOverride extends Partial<FieldConfig> {
    key: string;
}

interface SingleRecordDetailsProps {
    values: Record<string, unknown>;
    onChange: (key: string, value: unknown) => void;
    mode: 'view' | 'edit' | 'create';
    fieldOverrides?: FieldOverride[];
    hiddenFields?: string[];
}

interface ResolvedField {
    key: string;
    config: FieldConfig;
}

// ── Helpers ─────────────────────────────────────────────────────────

const resolveFields = (
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
            const { key: _, ...overrideConfig } = override ?? { key };
            const config = resolveFieldConfig(key, overrideConfig);
            return { key, config };
        })
        .filter((field) => !field.config.hidden && !hiddenFields.includes(field.key));
};

const getFieldLabel = (field: ResolvedField): string =>
    field.config.label
        ? field.config.label()
        : field.key;

// ── Auto-deduced inputs (fallback when no fieldInput provided) ──────

const autoInput = (
    key: string,
    value: unknown,
    onChange: (v: unknown) => void,
): React.ReactNode => {
    const strValue = value === null || value === undefined ? '' : String(value);

    return typeof value === 'boolean' ? (
        <label className="inputCheckboxLabel">
            <input
                type="checkbox"
                checked={value}
                onChange={(e) => onChange(e.target.checked)}
                className="inputCheckbox"
            />
            <span className="inputCheckboxText">{value ? 'Tak' : 'Nie'}</span>
        </label>
    ) : typeof value === 'number' ? (
        <input
            type="number"
            value={strValue}
            onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
            className="inputNumber"
            placeholder="0"
        />
    ) : key.endsWith('_date') ? (
        <input
            type="date"
            value={strValue}
            onChange={(e) => onChange(e.target.value || null)}
            className="inputDate"
        />
    ) : key.endsWith('_at') ? (
        <input
            type="datetime-local"
            value={strValue}
            onChange={(e) => onChange(e.target.value || null)}
            className="inputDateTime"
        />
    ) : key === 'notes' || key === 'description' ? (
        <textarea
            value={strValue}
            onChange={(e) => onChange(e.target.value)}
            className="inputTextarea"
            rows={3}
            placeholder="Wprowadź tekst..."
        />
    ) : (
        <input
            type="text"
            value={strValue}
            onChange={(e) => onChange(e.target.value || null)}
            className="inputText"
            placeholder="Wprowadź wartość"
        />
    );
};

// ── View mode value renderer ────────────────────────────────────────

const renderViewValue = (config: FieldConfig, value: unknown, row: Record<string, unknown>): React.ReactNode =>
    config.fieldOutput
        ? config.fieldOutput(value, row)
        : value === null || value === undefined
            ? <span className="cellNull">—</span>
            : typeof value === 'boolean'
                ? <span className={`cellBoolean ${value ? 'cellBooleanTrue' : 'cellBooleanFalse'}`}>
                    {value ? '✓ Tak' : '✗ Nie'}
                </span>
                : String(value);

// ── Field Component ─────────────────────────────────────────────────

interface FieldProps {
    field: ResolvedField;
    value: unknown;
    onChange: (v: unknown) => void;
    mode: 'view' | 'edit' | 'create';
    row: Record<string, unknown>;
}

const Field = ({ field, value, onChange, mode, row }: FieldProps) => {
    const { key, config } = field;
    const isEditable = (mode === 'edit' || mode === 'create') && config.fieldInput;

    return (
        <div className={styles.detailsField}>
            <label htmlFor={key} className={styles.detailsLabel}>
                {getFieldLabel(field)}
            </label>

            {isEditable ? (
                config.fieldInput ? (
                    config.fieldInput(value, onChange)
                ) : (
                    autoInput(key, value, onChange)
                )
            ) : (
                <span className={styles.detailsValue}>
                    {renderViewValue(config, value, row)}
                </span>
            )}
        </div>
    );
};

// ── SingleRecordDetails Component ───────────────────────────────────

export const SingleRecordDetails = ({
    values,
    onChange,
    mode,
    fieldOverrides = [],
    hiddenFields = [],
}: SingleRecordDetailsProps) => {
    const keys = Object.keys(values);
    const fields = resolveFields(keys, hiddenFields, fieldOverrides);

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
                        row={values}
                    />
                ))}
            </div>
        </fieldset>
    );
};