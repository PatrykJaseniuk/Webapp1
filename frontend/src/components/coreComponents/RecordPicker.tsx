'use client';
import { useState } from 'react';

import { ManyRecords } from '@/components/coreComponents/ManyRecords';
import { SingleRecordDetails } from '@/components/coreComponents/SingleRecordDetails';
import styles from '@/components/styles/shared.module.css';

// ── Types ───────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QueryFactory = () => any;

interface RecordPickerProps {
    title: string;
    query: QueryFactory;
    tableName: string;
    onSelect: (id: string) => void;
    onClose: () => void;
    hiddenColumns?: string[];
    defaultValues?: Record<string, unknown>;
}

// ── Component ───────────────────────────────────────────────────────

export const RecordPicker = ({
    title,
    query,
    tableName,
    onSelect,
    onClose,
    hiddenColumns = [],
    defaultValues = {},
}: RecordPickerProps) => {
    const [activeTab, setActiveTab] = useState<'browse' | 'create'>('browse');

    return (
        <div className={styles.pickerOverlay} onClick={onClose}>
            <div className={styles.pickerModal} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.pickerHeader}>
                    <h2 className={styles.pickerTitle}>{title}</h2>
                    <button className={styles.pickerClose} onClick={onClose}>
                        ✕
                    </button>
                </div>

                {/* Tabs */}
                <div className={styles.pickerTabs}>
                    <button
                        className={`${styles.pickerTab} ${activeTab === 'browse' ? styles.pickerTabActive : ''}`}
                        onClick={() => setActiveTab('browse')}
                    >
                        Wybierz istniejący
                    </button>
                    <button
                        className={`${styles.pickerTab} ${activeTab === 'create' ? styles.pickerTabActive : ''}`}
                        onClick={() => setActiveTab('create')}
                    >
                        Utwórz nowy
                    </button>
                </div>

                {/* Body */}
                <div className={styles.pickerBody}>
                    {activeTab === 'browse'
                        ? (
                            <ManyRecords
                                query={query}
                                hiddenColumns={hiddenColumns}
                                onRowClick={(row) => onSelect(row.id as string)}
                                pageSize={10}
                            />
                        )
                        : (
                            <SingleRecordDetails
                                id={null}
                                tableName={tableName as 'properties' | 'tenants' | 'lease_agreements' | 'transactions' | 'attachments' | 'user_roles'}
                                hiddenColumns={hiddenColumns}
                                onSave={(record) => onSelect(record.id as string)}
                                onDelete={onClose}
                            />
                        )}
                </div>
            </div>
        </div>
    );
};