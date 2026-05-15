'use client';

import styles from '@/components/styles/singleRecord.module.css';
import viewSingleStyles from '@/components/styles/pageLayout.module.css';
import { getFieldConfig } from '../fieldRegistry/registry';
import { useState } from 'react';

// ── Types ──────────────────────────────────────────────────────

type SingleRecordMode = 'read' | 'edit';

interface SingleRecordProps {
    fields: Record<string, unknown>;
    tableName?: string;
    recordId?: string;
    onSave?: (updated: Record<string, unknown>) => void;
    onCancel?: () => void;
}

// ── Component ───────────────────────────────────────────────────

export const SingleRecord = ({
    fields,
    tableName,
    recordId,
    onSave,
    onCancel,
}: SingleRecordProps) => {
    const [mode, setMode] = useState<SingleRecordMode>('read');
    const [editValues, setEditValues] = useState<Record<string, unknown>>(fields);

    const handleChange = (fieldKey: string, value: unknown): void => {
        setEditValues(prev => ({ ...prev, [fieldKey]: value }));
    };

    const handleSave = (): void => {
        onSave ? onSave(editValues) : setMode('read');
    };

    const handleCancel = (): void => {
        setEditValues(fields);
        setMode('read');
        onCancel && onCancel();
    };

    const visibleFieldKeys = Object.keys(fields).filter(
        fieldKey => !getFieldConfig(fieldKey).isHidden
    );

    return (
        <div className={viewSingleStyles.viewSingleContainer}>
            <div className={viewSingleStyles.viewSingleHeader}>
                <h2 className={viewSingleStyles.viewSingleTitle}>Szczegóły</h2>
                <div className={viewSingleStyles.viewSingleActions}>
                    {mode === 'read' ? (
                        <button onClick={() => setMode('edit')}>Edytuj</button>
                    ) : (
                        <>
                            <button onClick={handleSave}>Zapisz</button>
                            <button onClick={handleCancel}>Anuluj</button>
                        </>
                    )}
                </div>
            </div>

            <fieldset className={styles.detailsFieldset}>
                <div className={styles.detailsGrid}>
                    {visibleFieldKeys.map(fieldKey => {
                        const config = getFieldConfig(fieldKey);
                        const currentValue = mode === 'edit' 
                            ? (editValues[fieldKey] ?? fields[fieldKey]) 
                            : fields[fieldKey];
                        
                        return (
                            <div key={fieldKey} className={styles.detailsField}>
                                <label htmlFor={fieldKey} className={styles.detailsLabel}>
                                    {config.label}
                                </label>
                                <div className={styles.detailsValue}>
                                    {config.fieldRenderer({
                                        value: currentValue,
                                        mode,
                                        context: 'details',
                                        fieldKey,
                                        onChange: (value: unknown) => handleChange(fieldKey, value),
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </fieldset>
        </div>
    );
};