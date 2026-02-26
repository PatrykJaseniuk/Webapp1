'use client';
import { useState, useEffect } from 'react';
import { useAsync, useAsyncFn } from 'react-use';

import { database } from '@/api/database';
import { routes } from '@/routes';
import { Spinner } from '@/components/coreComponents/Spinner';
import { ErrorBanner } from '@/components/coreComponents/ErrorBanner';
import { SingleRecordDetails } from '@/components/coreComponents/SingleRecordDetails';
import { SingleRecordReference } from '@/components/coreComponents/SingleRecordReference';
import { ManyRecords } from '@/components/coreComponents/ManyRecords';
import { ConfirmDialog } from '@/components/coreComponents/ConfirmDialog';
import styles from '@/components/styles/viewSingle.module.css';
import { useRouter } from 'next/navigation';

interface ViewSingleLeaseProps {
    id?: string;
}

export const ViewSingleLease = ({ id }: ViewSingleLeaseProps) => {
    const router = useRouter();
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
            : await database.from('lease_agreements').select('*').eq('id', id).single()
        , [id, refreshKey]);

    useEffect(() => {
        state.value?.data && setFormState(state.value.data as Record<string, unknown>);
    }, [state.value?.data]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [saveState, handleSave] = useAsyncFn(async () =>
        isCreateMode
            ? await (database as any).from('lease_agreements').insert(formState).select().single()
            : await (database as any).from('lease_agreements').update(formState).eq('id', id).select().single()
        , [formState, id]);

    const [deleteState, handleDelete] = useAsyncFn(async () =>
        await database.from('lease_agreements').delete().eq('id', id!)
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
                                                ? router.push(routes.landlord.leases({ id: (r.data as Record<string, unknown>).id as string }))
                                                : (setMode('view'), handleRefresh()));
                                        })}
                                    >
                                        {saveState.loading ? 'Zapisuję...' : mode === 'create' ? 'Utwórz' : 'Zapisz'}
                                    </button>
                                    <button
                                        className={styles.viewSingleButtonSecondary}
                                        onClick={() => isCreateMode ? router.push(routes.landlord.leases()) : (setMode('view'), handleRefresh())}
                                    >
                                        Anuluj
                                    </button>
                                </>
                            )}
                        </div>

                        {saveState.error && <ErrorBanner msg={saveState.error.message} />}

                        <SingleRecordDetails
                            values={formState}
                            onChange={updateField}
                            mode={mode}
                        />

                        <SingleRecordReference
                            label="Najemcaaa"
                            referenceId={(formState.tenant_id as string) ?? null}
                            onChange={(newId) => updateField('tenant_id', newId)}
                            query={(refId) => database.from('tenants').select('*').eq('id', refId).single()}
                            pickerQuery={() => database.from('tenants').select('*')}
                            pickerTableName="tenants"
                            navigateTo={(refId) => routes.landlord.tenants({ id: refId })}
                            nullable={false}
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
                            nullable={false}
                            mode={mode}
                        />

                        <ManyRecords
                            label="Transakcje"
                            query={() => database.from('transactions').select('*').eq('lease_id', id!)}
                            // hiddenColumns={['id', 'lease_id', 'property_id', 'created_by', 'updated_at']}
                            defaultSortKey="due_date"
                            defaultSortDirection="desc"
                            onRowClick={(row) => router.push(routes.landlord.transactions({ id: row.id as string }))}
                            disabled={isCreateMode}
                            disabledMessage="Zapisz umowę, aby dodać transakcje"
                            refreshKey={refreshKey}
                        />

                        {showDeleteConfirm && (
                            <ConfirmDialog
                                message="Czy na pewno chcesz usunąć tę umowę najmu?"
                                onConfirm={() => handleDelete().then(() => router.push(routes.landlord.leases()))}
                                onCancel={() => setShowDeleteConfirm(false)}
                                loading={deleteState.loading}
                            />
                        )}
                    </div>
    );
};
