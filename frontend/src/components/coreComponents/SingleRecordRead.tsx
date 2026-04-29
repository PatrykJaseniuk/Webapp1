'use client';

import styles from '@/components/styles/shared.module.css';
import { getFieldConfig } from '../fieldRegistry/registry';
import { useState } from 'react';


interface SingleRecordProps {
    fields: Record<string, unknown>;
    onEdit?: () => Record<string, unknown>
}

export const SingleRecord = ({
    fields,
    onEdit
}: SingleRecordProps) => {

    const [mode, setMode] = useState<'edit'|'read'>("read")

    


    return (
        <fieldset className={styles.detailsFieldset}>
            <div className={styles.detailsGrid}>
                {Object.keys(fields).map((fieldKey) => (
                    getFieldConfig(fieldKey).isHidden ||
                    <div key={fieldKey}
                        className={styles.detailsField}>
                        <label htmlFor={fieldKey} className={styles.detailsLabel}>
                            {getFieldConfig(fieldKey).label}
                        </label>
                        <span className={styles.detailsValue}>
                            {getFieldConfig(fieldKey).fieldOutput(fields[fieldKey])}
                        </span>
                    </div>
                ))}
            </div>
        </fieldset>
    );
};