'use client';

import { useState } from 'react';
import { useAsyncFn } from 'react-use';

import { database } from '@/api/database';
import type { Database } from '@/api/database.types';
import { ManyRecords } from '@/components/coreComponents/ManyRecords';
import { SingleRecordEdit } from '@/components/coreComponents/SingleRecordEdit';
import styles from '@/components/styles/shared.module.css';

// ── Types ───────────────────────────────────────────────────────────

type TableName = keyof Database['public']['Tables'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QueryFactory = () => any;

interface RecordPickerProps {
    title: string;
    query: QueryFactory;
    tableName: TableName;
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
    const [formState, setFormState] = useState<Record<string, unknown>>(defaultValues);

    // Create mutation
    const [createState, handleCreate] = useAsyncFn(async () => {
        const scalarFields = Object.fromEntries(
            Object.entries(formState).filter(([_, v]) => typeof v !== 'object' || v === null)
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const table = database.from(tableName) as any;
        return await table.insert(scalarFields).select().single();
    }, [formState, tableName]);

    // Field change handler
    const updateField = (key: string, value: unknown) =>
        setFormState((prev) => ({ ...prev, [key]: value }));

    // Handle create submit
    const handleSubmit = () => {
        handleCreate().then((result) => {
            result?.data && onSelect(result.data.id as string);
        });
    };

    // Reset form when switching to create tab
    const handleTabChange = (tab: 'browse' | 'create') => {
        setActiveTab(tab);
        if (tab === 'create') {
            setFormState(defaultValues);
        }
    };

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
                        onClick={() => handleTabChange('browse')}
                    >
                        Wybierz istniejący
                    </button>
                    <button
                        className={`${styles.pickerTab} ${activeTab === 'create' ? styles.pickerTabActive : ''}`}
                        onClick={() => handleTabChange('create')}
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
                            <SingleRecordEdit
                                values={formState}
                                onChange={updateField}
                                hiddenColumns={hiddenColumns}
                                onSubmit={handleSubmit}
                                onCancel={onClose}
                                submitLabel="Utwórz"
                                loading={createState.loading}
                            />
                        )}
                </div>
            </div>
        </div>
    );
};