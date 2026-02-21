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

interface ViewSingleTenantProps {
    id?: string;
}

export const ViewSingleTenant = ({ id }: ViewSingleTenantProps) => {
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
            : await database.from('tenants').select('*').eq('id', id).single()
        , [id, refreshKey]);

    useEffect(() => {
        state.value?.data && setFormState(state.value.data as Record<string, unknown>);
    }, [state.value?.data]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [saveState, handleSave] = useAsyncFn(async () =>
        isCreateMode
            ? await (database as any).from('tenants').insert(formState).select().single()
            : await (database as any).from('tenants').update(formState).eq('id', id).select().single()
        , [formState, id]);

    const [deleteState, handleDelete] = useAsyncFn(async () =>
        await database.from('tenants').delete().eq('id', id!)
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
                                                ? navigate(routes.landlord.tenants({ id: (r.data as Record<string, unknown>).id as string }))
                                                : (setMode('view'), handleRefresh()));
                                        })}
                                    >
                                        {saveState.loading ? 'Zapisuję...' : mode === 'create' ? 'Utwórz' : 'Zapisz'}
                                    </button>
                                    <button
                                        className={styles.viewSingleButtonSecondary}
                                        onClick={() => isCreateMode ? navigate(routes.landlord.tenants()) : (setMode('view'), handleRefresh())}
                                    >
                                        Anuluj
                                    </button>
                                </>
                            )}
                        </div>

                        {saveState.error && <ErrorBanner msg={saveState.error.message} />}

                        <SingleRecordDetails
                            tableName="tenants"
                            values={formState}
                            onChange={updateField}
                            mode={mode}
                        />

                        <ManyRecords
                            label="Umowy najmu"
                            tableName="lease_agreements"
                            query={() => database.from('lease_agreements').select('*').eq('tenant_id', id!)}
                            mode="table"
                            hiddenColumns={['id', 'tenant_id', 'created_by', 'updated_at', 'notes']}
                            onRowClick={(row) => navigate(routes.landlord.leases({ id: row.id as string }))}
                            disabled={isCreateMode}
                            disabledMessage="Zapisz najemcę, aby zobaczyć umowy"
                            refreshKey={refreshKey}
                        />

                        {showDeleteConfirm && (
                            <ConfirmDialog
                                message="Czy na pewno chcesz usunąć tego najemcę?"
                                onConfirm={() => handleDelete().then(() => navigate(routes.landlord.tenants()))}
                                onCancel={() => setShowDeleteConfirm(false)}
                                loading={deleteState.loading}
                            />
                        )}
                    </div>
    );
};
