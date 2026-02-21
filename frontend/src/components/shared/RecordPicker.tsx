'use client';
import { useState } from 'react';
import { useAsyncFn } from 'react-use';

import { database } from '@/api/database';
import { ManyRecords } from '@/components/shared/ManyRecords';
import { SingleRecordDetails } from '@/components/shared/SingleRecordDetails';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
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
    const [createValues, setCreateValues] = useState<Record<string, unknown>>(defaultValues);

    const updateCreateField = (key: string, value: unknown) =>
        setCreateValues((prev) => ({ ...prev, [key]: value }));

    // Create mutation
    const [createState, handleCreate] = useAsyncFn(async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (database as any)
            .from(tableName)
            .insert(createValues)
            .select()
            .single();
        return { data: data as Record<string, unknown> | null, error };
    }, [createValues, tableName]);

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
                    {activeTab === 'browse' ? (
                        <ManyRecords
                            tableName={tableName}
                            query={query}
                            mode="table"
                            hiddenColumns={hiddenColumns}
                            onRowClick={(row) => onSelect(row.id as string)}
                            pageSize={10}
                        />
                    ) : (
                        <>
                            <SingleRecordDetails
                                tableName={tableName}
                                values={createValues}
                                onChange={updateCreateField}
                                mode="create"
                            />

                            {createState.error && (
                                <ErrorBanner msg={createState.error.message} />
                            )}
                            {createState.value?.error && (
                                <ErrorBanner msg={createState.value.error.message} />
                            )}

                            <div className={styles.pickerCreateActions}>
                                <button
                                    className={styles.buttonSecondary}
                                    onClick={onClose}
                                >
                                    Anuluj
                                </button>
                                <button
                                    className={styles.buttonPrimary}
                                    disabled={createState.loading}
                                    onClick={() =>
                                        handleCreate().then((result) => {
                                            result?.data && onSelect((result.data as Record<string, unknown>).id as string);
                                        })
                                    }
                                >
                                    {createState.loading ? 'Tworzenie...' : 'Utwórz i wybierz'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
