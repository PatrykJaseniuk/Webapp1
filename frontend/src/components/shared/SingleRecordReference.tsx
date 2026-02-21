'use client';
import { useState } from 'react';
import { useAsync } from 'react-use';

import { resolveColumnConfig } from '@/constants/columnRegistry';
import { Spinner } from '@/components/shared/Spinner';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { SingleRecordDetails } from '@/components/shared/SingleRecordDetails';
import { RecordPicker } from '@/components/shared/RecordPicker';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import styles from '@/components/styles/shared.module.css';

// ── Types ───────────────────────────────────────────────────────────

interface SingleRecordReferenceProps {
    label: string;
    referenceId: string | null;
    onChange: (newId: string | null) => void;
    query: (id: string) => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>;
    summaryFields?: string[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pickerQuery: () => any;
    pickerTableName: string;
    navigateTo?: (id: string) => string;
    nullable?: boolean;
    mode: 'view' | 'edit' | 'create';
}

// ── Helpers ─────────────────────────────────────────────────────────

const buildSummary = (
    data: Record<string, unknown>,
    tableName: string,
    summaryFields?: string[],
): string => {
    const keys = summaryFields ?? Object.keys(data).filter((key) => {
        const config = resolveColumnConfig(tableName, key);
        return !config.hidden && !config.readonly && key !== 'id';
    }).slice(0, 3);

    return keys
        .map((key) => {
            const value = data[key];
            return value === null || value === undefined ? '' : String(value);
        })
        .filter((v) => v.length > 0)
        .join(' · ');
};

// ── Component ───────────────────────────────────────────────────────

export const SingleRecordReference = ({
    label: sectionLabel,
    referenceId,
    onChange,
    query,
    summaryFields,
    pickerQuery,
    pickerTableName,
    navigateTo,
    nullable = false,
    mode,
}: SingleRecordReferenceProps) => {
    const [showPicker, setShowPicker] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

    // Fetch referenced record
    const refState = useAsync(async () => {
        return referenceId
            ? await query(referenceId)
            : { data: null, error: null };
    }, [referenceId]);

    const refData = refState.value?.data ?? null;
    const refError = refState.value?.error ?? null;
    const isEditable = mode === 'edit' || mode === 'create';
    const hasReference = !!referenceId && !!refData;

    const labelClassName = `${styles.referenceLabel}${!nullable && isEditable ? ` ${styles.referenceLabelRequired}` : ''
        }`;

    return (
        <div className={styles.referenceSection}>
            {/* Header */}
            <div className={styles.referenceHeader}>
                <span className={labelClassName}>{sectionLabel}</span>
            </div>

            {/* Loading/Error/Content */}
            {refState.loading ? (
                <Spinner />
            ) : refError ? (
                <ErrorBanner msg={refError.message} />
            ) : refState.error ? (
                <ErrorBanner msg={refState.error.message} />
            ) : hasReference ? (
                <>
                    {/* Summary */}
                    <p className={styles.referenceSummary}>
                        {buildSummary(refData, pickerTableName, summaryFields)}
                    </p>

                    {/* Actions */}
                    <div className={styles.referenceActions}>
                        {/* Preview */}
                        <button
                            className={styles.buttonSecondary}
                            onClick={() => setShowPreview(true)}
                        >
                            Podgląd
                        </button>

                        {/* Navigate */}
                        {navigateTo && referenceId && (
                            <a
                                href={navigateTo(referenceId)}
                                className={styles.buttonSecondary}
                                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                            >
                                Otwórz ↗
                            </a>
                        )}

                        {/* Change (edit/create) */}
                        {isEditable && (
                            <button
                                className={styles.buttonSecondary}
                                onClick={() => setShowPicker(true)}
                            >
                                Zmień
                            </button>
                        )}

                        {/* Remove (edit/create + nullable) */}
                        {isEditable && nullable && (
                            <button
                                className={styles.buttonDanger}
                                onClick={() => setShowRemoveConfirm(true)}
                            >
                                Usuń
                            </button>
                        )}
                    </div>
                </>
            ) : (
                <>
                    {/* No reference set */}
                    <p className={styles.referenceEmpty}>Nie wybrano</p>

                    {isEditable && (
                        <div className={styles.referenceActions}>
                            <button
                                className={styles.buttonPrimary}
                                onClick={() => setShowPicker(true)}
                            >
                                Wybierz
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Preview modal */}
            {showPreview && refData && (
                <div className={styles.overlay} onClick={() => setShowPreview(false)}>
                    <div className={styles.dialog} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '40rem', width: '95%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{sectionLabel}</h3>
                            <button className={styles.buttonSecondary} onClick={() => setShowPreview(false)}>
                                Zamknij
                            </button>
                        </div>
                        <SingleRecordDetails
                            tableName={pickerTableName}
                            values={refData}
                            onChange={() => { }}
                            mode="view"
                        />
                        {navigateTo && referenceId && (
                            <div style={{ marginTop: '1rem', textAlign: 'right' }}>
                                <a
                                    href={navigateTo(referenceId)}
                                    className={styles.buttonPrimary}
                                    style={{ textDecoration: 'none' }}
                                >
                                    Otwórz ↗
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Record picker */}
            {showPicker && (
                <RecordPicker
                    title={`Wybierz: ${sectionLabel}`}
                    query={pickerQuery}
                    tableName={pickerTableName}
                    onSelect={(id) => {
                        onChange(id);
                        setShowPicker(false);
                    }}
                    onClose={() => setShowPicker(false)}
                />
            )}

            {/* Remove confirmation */}
            {showRemoveConfirm && (
                <ConfirmDialog
                    message={`Czy na pewno chcesz usunąć powiązanie: ${sectionLabel}?`}
                    onConfirm={() => {
                        onChange(null);
                        setShowRemoveConfirm(false);
                    }}
                    onCancel={() => setShowRemoveConfirm(false)}
                />
            )}
        </div>
    );
};
