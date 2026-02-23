'use client';
import { useState, useEffect } from 'react';
import { useAsync, useAsyncFn } from 'react-use';

import { database } from '@/api/database';
import { useNavigate } from '@/routes/useNavigate';
import { routes } from '@/routes';
import { Spinner } from '@/components/shared/Spinner';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { SingleRecordDetails } from '@/components/shared/SingleRecordDetails';
import { ManyRecords } from '@/components/shared/ManyRecords';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import styles from '@/components/styles/viewSingle.module.css';

interface ViewSinglePropertyProps {
    id?: string;
}

export const ViewSingleProperty = ({ id }: ViewSinglePropertyProps) => {
    const navigate = useNavigate();
    const isCreateMode = !id;
    const [mode, setMode] = useState<'view' | 'edit' | 'create'>(isCreateMode ? 'create' : 'view');
    const [refreshKey, setRefreshKey] = useState(0);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [formState, setFormState] = useState<Record<string, unknown>>({});

    const updateField = (key: string, value: unknown) =>
        setFormState((prev) => ({ ...prev, [key]: value }));

    const state = useAsync(async () =>
        isCreateMode
            ? { data: null, error: null }
            : await database.from('properties').select('*').eq('id', id).single()
    , [id, refreshKey]);

    useEffect(() => {
        state.value?.data && setFormState(state.value.data as Record<string, unknown>);
    }, [state.value?.data]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [saveState, handleSave] = useAsyncFn(async () =>
        isCreateMode
            ? await (database as any).from('properties').insert(formState).select().single()
            : await (database as any).from('properties').update(formState).eq('id', id).select().single()
    , [formState, id]);

    const [deleteState, handleDelete] = useAsyncFn(async () =>
        await database.from('properties').delete().eq('id', id!)
    , [id]);

    const handleRefresh = () => setRefreshKey((p) => p + 1);

    return (
        state.error ? <ErrorBanner msg={state.error.message} retry={handleRefresh} /> :
        state.loading ? <Spinner /> :
        state.value?.error ? <ErrorBanner msg={state.value.error.message} /> :
        <div className={styles.viewSingleContainer}>
            <div className={styles.viewSingleActions}>
                {mode === 'view' && (
                    <>
                        <button className={styles.viewSingleButton} onClick={() => setMode('edit')}>Edytuj</button>
                        <button className={styles.viewSingleButtonDanger} onClick={() => setShowDeleteConfirm(true)}>Usuń</button>
                    </>
                )}
                {(mode === 'edit' || mode === 'create') && (
                    <>
                        <button
                            className={styles.viewSingleButton}
                            disabled={saveState.loading}
                            onClick={() => handleSave().then((r) => {
                                r?.data && (isCreateMode
                                    ? navigate(routes.landlord.properties({ id: (r.data as Record<string, unknown>).id as string }))
                                    : (setMode('view'), handleRefresh()));
                            })}
                        >
                            {saveState.loading ? 'Zapisuję...' : mode === 'create' ? 'Utwórz' : 'Zapisz'}
                        </button>
                        <button
                            className={styles.viewSingleButtonSecondary}
                            onClick={() => isCreateMode ? navigate(routes.landlord.properties()) : (setMode('view'), handleRefresh())}
                        >
                            Anuluj
                        </button>
                    </>
                )}
            </div>

            {saveState.error && <ErrorBanner msg={saveState.error.message} />}

            <SingleRecordDetails
                tableName="properties"
                values={formState}
                onChange={updateField}
                mode={mode}
            />

            <ManyRecords
                label="Umowy najmu"
                tableName="lease_agreements"
                query={() => database.from('lease_agreements').select('*').eq('property_id', id!)}
                hiddenColumns={['id', 'property_id', 'created_by', 'updated_at', 'notes']}
                onRowClick={(row) => navigate(routes.landlord.leases({ id: row.id as string }))}
                disabled={isCreateMode}
                disabledMessage="Zapisz nieruchomość, aby dodać umowy"
                refreshKey={refreshKey}
            />

            <ManyRecords
                label="Transakcje"
                tableName="transactions"
                query={() => database.from('transactions').select('*').eq('property_id', id!)}
                hiddenColumns={['id', 'property_id', 'lease_id', 'created_by', 'updated_at']}
                defaultSortKey="due_date"
                defaultSortDirection="desc"
                onRowClick={(row) => navigate(routes.landlord.transactions({ id: row.id as string }))}
                disabled={isCreateMode}
                disabledMessage="Zapisz nieruchomość, aby dodać transakcje"
                refreshKey={refreshKey}
            />

            {showDeleteConfirm && (
                <ConfirmDialog
                    message="Czy na pewno chcesz usunąć tę nieruchomość?"
                    onConfirm={() => handleDelete().then(() => navigate(routes.landlord.properties()))}
                    onCancel={() => setShowDeleteConfirm(false)}
                    loading={deleteState.loading}
                />
            )}
        </div>
    );
};
