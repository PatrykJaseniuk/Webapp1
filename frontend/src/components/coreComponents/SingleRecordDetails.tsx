'use client';
import { useState, useEffect } from 'react';
import { useAsync, useAsyncFn } from 'react-use';

import { database } from '@/api/database';
import type { Database } from '@/api/database.types';
import { resolveFieldConfig } from '@/components/fieldRegistry';
import type { FieldConfig } from '@/components/fieldRegistry';
import { ErrorBanner } from '@/components/coreComponents/ErrorBanner';
import { Spinner } from '@/components/coreComponents/Spinner';
import { ConfirmDialog } from '@/components/coreComponents/ConfirmDialog';
import cellStyles from '@/components/styles/cellRenderers.module.css';
import inputStyles from '@/components/styles/inputRenderers.module.css';
import styles from '@/components/styles/shared.module.css';

// ── Types ───────────────────────────────────────────────────────────

type TableName = keyof Database['public']['Tables'];

interface FieldOverrides {
    [key: string]: Partial<FieldConfig>;
}

interface SingleRecordDetailsProps {
    /** Record ID - null/undefined = create mode */
    id?: string | null;
    
    /** Table name (type-safe) */
    tableName: TableName;
    
    /** Select string for fetching (default: '*') - can include relations */
    select?: string;
    
    /** Column overrides */
    columns?: FieldOverrides;
    
    /** Columns to hide */
    hiddenColumns?: string[];
    
    /** Callback after successful save */
    onSave?: (record: Record<string, unknown>) => void;
    
    /** Callback after successful delete */
    onDelete?: () => void;
    
    /** Section label */
    label?: string;
    
    /** Refresh key to refetch data */
    refreshKey?: number;
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

            {isEditable
                ? config.fieldInput
                    ? config.fieldInput(value, onChange)
                    : autoInput(key, value, onChange)
                : <span className={styles.detailsValue}>
                    {renderViewValue(config, value, row)}
                </span>}
        </div>
    );
};

// ── SingleRecordDetails Component ───────────────────────────────────

export const SingleRecordDetails = ({
    id,
    tableName,
    select = '*',
    columns: fieldOverrides = {},
    hiddenColumns = [],
    onSave,
    onDelete,
    label,
    refreshKey = 0,
}: SingleRecordDetailsProps) => {
    const isCreateMode = !id;
    const [formState, setFormState] = useState<Record<string, unknown>>({});
    const [mode, setMode] = useState<'view' | 'edit' | 'create'>(isCreateMode ? 'create' : 'view');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Fetch data
    const state = useAsync(async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const table = database.from(tableName) as any;
        return isCreateMode
            ? { data: null, error: null }
            : await table.select(select).eq('id', id).single();
    }, [id, refreshKey]);

    // Initialize formState when data loads
    useEffect(() => {
        state.value?.data && setFormState(state.value.data);
    }, [state.value?.data]);

    // Update mode when id changes
    useEffect(() => {
        setMode(isCreateMode ? 'create' : 'view');
    }, [id]);

    // Field change handler
    const updateField = (key: string, value: unknown) =>
        setFormState((prev) => ({ ...prev, [key]: value }));

    // Save mutation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [saveState, handleSave] = useAsyncFn(async () => {
        const table = database.from(tableName) as any;
        // Remove relation fields from formState before save
        const scalarFields = Object.fromEntries(
            Object.entries(formState).filter(([key]) => {
                const value = formState[key];
                return typeof value !== 'object' || value === null;
            })
        );
        return isCreateMode
            ? await table.insert(scalarFields).select().single()
            : await table.update(scalarFields).eq('id', id).select().single();
    }, [formState, id, tableName]);

    // Delete mutation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [deleteState, handleDelete] = useAsyncFn(async () => {
        const table = database.from(tableName) as any;
        return await table.delete().eq('id', id);
    }, [id, tableName]);

    // Handlers
    const handleSaveClick = () => {
        handleSave().then((result) => {
            result?.data && onSave?.(result.data);
        });
    };

    const handleDeleteConfirm = () => {
        handleDelete().then((result) => {
            !result?.error && onDelete?.();
        });
    };

    const handleCancel = () =>
        isCreateMode
            ? onDelete?.()
            : (setMode('view'), setFormState(state.value?.data ?? {}));

    // Resolve fields (only scalar fields for editing)
    const keys = Object.keys(formState).length > 0
        ? Object.keys(formState).filter((key) => {
            const value = formState[key];
            return typeof value !== 'object' || value === null;
        })
        : state.value?.data
            ? Object.keys(state.value.data).filter((key) => {
                const value = state.value!.data![key];
                return typeof value !== 'object' || value === null;
            })
            : [];
    const resolvedFields = resolveFields(keys, hiddenColumns, fieldOverrides);

    return (
        state.error
            ? <ErrorBanner msg={state.error.message} />
            : state.loading && !isCreateMode
                ? <Spinner />
                : state.value?.error
                    ? <ErrorBanner msg={state.value.error.message} />
                    : <div className={styles.detailsWrapper}>
                        {/* Header */}
                        {(label ?? mode !== 'view') && (
                            <div className={styles.sectionHeader}>
                                {label && <h3 className={styles.sectionTitle}>{label}</h3>}
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className={styles.detailsActions}>
                            {mode === 'view'
                                ? (
                                    <>
                                        <button
                                            className={styles.buttonPrimary}
                                            onClick={() => setMode('edit')}
                                        >
                                            Edytuj
                                        </button>
                                        <button
                                            className={styles.buttonDanger}
                                            onClick={() => setShowDeleteConfirm(true)}
                                        >
                                            Usuń
                                        </button>
                                    </>
                                )
                                : (
                                    <>
                                        <button
                                            className={styles.buttonPrimary}
                                            onClick={handleSaveClick}
                                            disabled={saveState.loading}
                                        >
                                            {saveState.loading
                                                ? 'Zapisuję...'
                                                : mode === 'create'
                                                    ? 'Utwórz'
                                                    : 'Zapisz'}
                                        </button>
                                        <button
                                            className={styles.buttonSecondary}
                                            onClick={handleCancel}
                                            disabled={saveState.loading}
                                        >
                                            Anuluj
                                        </button>
                                    </>
                                )}
                        </div>

                        {/* Save error */}
                        {saveState.error && (
                            <ErrorBanner msg={saveState.error.message} />
                        )}
                        {saveState.value?.error && (
                            <ErrorBanner msg={saveState.value.error.message} />
                        )}

                        {/* Field grid */}
                        <fieldset className={styles.detailsFieldset}>
                            <div className={styles.detailsGrid}>
                                {resolvedFields.map((field) => (
                                    <Field
                                        key={field.key}
                                        field={field}
                                        value={formState[field.key]}
                                        onChange={(v) => updateField(field.key, v)}
                                        mode={mode}
                                        row={formState}
                                    />
                                ))}
                            </div>
                        </fieldset>

                        {/* Delete confirmation */}
                        {showDeleteConfirm && (
                            <ConfirmDialog
                                message="Czy na pewno chcesz usunąć ten rekord?"
                                onConfirm={handleDeleteConfirm}
                                onCancel={() => setShowDeleteConfirm(false)}
                                loading={deleteState.loading}
                            />
                        )}
                    </div>
    );
};