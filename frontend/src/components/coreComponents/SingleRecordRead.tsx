'use client';

import { resolveFieldConfig } from '@/components/fieldRegistry';
import type { FieldConfig } from '@/components/fieldRegistry/types';
import styles from '@/components/styles/shared.module.css';
import cellStyles from '@/components/styles/cellRenderers.module.css';

// ── Types ───────────────────────────────────────────────────────────

interface FieldOverrides {
    [key: string]: Partial<FieldConfig>;
}

interface SingleRecordReadProps {
    /** Current record values (controlled from parent) */
    values: Record<string, unknown>;
}

interface ResolvedField {
    key: string;
    config: FieldConfig;
}

// ── Helpers ─────────────────────────────────────────────────────────


const resolveFields = (
    keys: string[],
): ResolvedField[] => {
    return keys
        .map((key) => {
            const config = resolveFieldConfig(key);
            return { key, config };
        })
};

const getFieldLabel = (field: ResolvedField): string =>
    field.config.label ?? field.key;

// ── View mode value renderer ────────────────────────────────────────

const renderViewValue = (config: FieldConfig, value: unknown, row: Record<string, unknown>): React.ReactNode =>
    config.fieldOutput
        ? config.fieldOutput(value, row)
        : value === null || value === undefined
            ? <span className={cellStyles.cellNull}>—</span>
            : typeof value === 'boolean'
                ? <span className={cellStyles.cellBoolean + ' ' + (value ? cellStyles.cellBooleanTrue : cellStyles.cellBooleanFalse)}>
                    {value ? '✓ Tak' : '✗ Nie'}
                </span>
                : String(value);

// ── Field Component ─────────────────────────────────────────────────

interface FieldProps {
    field: ResolvedField;
    value: unknown;
    row: Record<string, unknown>;
}

const Field = ({ field, value, row }: FieldProps) => {
    const { key, config } = field;

    return (
        <div className={styles.detailsField}>
            <label htmlFor={key} className={styles.detailsLabel}>
                {getFieldLabel(field)}
            </label>
            <span className={styles.detailsValue}>
                {renderViewValue(config, value, row)}
            </span>
        </div>
    );
};

// ── SingleRecordRead Component ──────────────────────────────────────

export const SingleRecordRead = ({
    values,
}: SingleRecordReadProps) => {
    const keys = Object.keys(values)

    const fields = keys.map((key) => {
        const fieldConfig = resolveFieldConfig(key)

        const field = { label: fieldConfig.label, output: fieldConfig.fieldOutput && fieldConfig.fieldOutput(values[key], values) }
        // const field = { label :key, }

    })

    const resolvedFields = resolveFields(keys)

    return (
        <fieldset className={styles.detailsFieldset}>
            <div className={styles.detailsGrid}>
                {resolvedFields.map((field) => (
                    <Field
                        key={field.key}
                        field={field}
                        value={values[field.key]}
                        row={values}
                    />
                ))}
            </div>
        </fieldset>
    );
};