'use client';
import { useState, useEffect } from 'react';
import { useAsync, useAsyncFn } from 'react-use';

import { database } from '@/api/database';
import { useNavigate } from '@/routes/useNavigate';
import { routes } from '@/routes';
import { Spinner } from '@/components/shared/Spinner';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { SingleRecordDetails } from '@/components/shared/SingleRecordDetails';
import { SingleRecordReference } from '@/components/shared/SingleRecordReference';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import styles from '@/components/styles/viewSingle.module.css';

interface ViewSingleTransactionProps {
    id?: string;
}

export const ViewSingleTransaction = ({ id }: ViewSingleTransactionProps) => {
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
            : await database.from('transactions').select('*').eq('id', id).single()
        , [id, refreshKey]);

    useEffect(() => {
        state.value?.data && setFormState(state.value.data as Record<string, unknown>);
    }, [state.value?.data]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [saveState, handleSave] = useAsyncFn(async () =>
        isCreateMode
            ? await (database as any).from('transactions').insert(formState).select().single()
            : await (database as any).from('transactions').update(formState).eq('id', id).select().single()
        , [formState, id]);

    const [deleteState, handleDelete] = useAsyncFn(async () =>
        await database.from('transactions').delete().eq('id', id!)
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
                                                ? navigate(routes.landlord.transactions({ id: (r.data as Record<string, unknown>).id as string }))
                                                : (setMode('view'), handleRefresh()));
                                        })}
                                    >
                                        {saveState.loading ? 'Zapisuję...' : mode === 'create' ? 'Utwórz' : 'Zapisz'}
                                    </button>
                                    <button
                                        className={styles.viewSingleButtonSecondary}
                                        onClick={() => isCreateMode ? navigate(routes.landlord.transactions()) : (setMode('view'), handleRefresh())}
                                    >
                                        Anuluj
                                    </button>
                                </>
                            )}
                        </div>

                        {saveState.error && <ErrorBanner msg={saveState.error.message} />}

                        <SingleRecordDetails
                            tableName="transactions"
                            values={formState}
                            onChange={updateField}
                            mode={mode}
                        />

                        <SingleRecordReference
                            label="Umowa najmu"
                            referenceId={(formState.lease_id as string) ?? null}
                            onChange={(newId) => updateField('lease_id', newId)}
                            query={(refId) => database.from('lease_agreements').select('*').eq('id', refId).single()}
                            pickerQuery={() => database.from('lease_agreements').select('*')}
                            pickerTableName="lease_agreements"
                            navigateTo={(refId) => routes.landlord.leases({ id: refId })}
                            nullable={true}
                            mode={mode}
                        />

                        <SingleRecordReference
                            label="Nieruchomość"
                            referenceId={(formState.property_id as string) ?? null}
                            onChange={(newId) => updateField('property_id', newId)}
                            query={(refId) => database.from('properties').select('*').eq('id', refId).single()}
                            pickerQuery={() => database.from('properties').select('*')}
                            pickerTableName="properties"
                            navigateTo={(refId) => routes.landlord.properties({ id: refId })}
                            nullable={true}
                            mode={mode}
                        />

                        {showDeleteConfirm && (
                            <ConfirmDialog
                                message="Czy na pewno chcesz usunąć tę transakcję?"
                                onConfirm={() => handleDelete().then(() => navigate(routes.landlord.transactions()))}
                                onCancel={() => setShowDeleteConfirm(false)}
                                loading={deleteState.loading}
                            />
                        )}
                    </div>
    );
};
