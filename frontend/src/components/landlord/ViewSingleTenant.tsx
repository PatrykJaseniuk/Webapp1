'use client';

import { useState, useEffect } from 'react';
import { useAsync, useAsyncFn } from 'react-use';

import { routes } from '@/routes';
import { useRouter } from 'next/navigation';
import { database } from '@/api/database';
import { SingleRecordRead } from '@/components/coreComponents/SingleRecordRead';
import { SingleRecordEdit } from '@/components/coreComponents/SingleRecordEdit';
import { ManyRecords } from '@/components/coreComponents/ManyRecords';
import { ConfirmDialog } from '@/components/coreComponents/ConfirmDialog';
import { Spinner } from '@/components/coreComponents/Spinner';
import { ErrorBanner } from '@/components/coreComponents/ErrorBanner';
import styles from '@/components/styles/viewSingle.module.css';

interface ViewSingleTenantProps {
    id?: string;
}

export const ViewSingleTenant = ({ id }: ViewSingleTenantProps) => {
    const router = useRouter();
    const isCreateMode = !id;
    const [mode, setMode] = useState<'view' | 'edit' | 'create'>(isCreateMode ? 'create' : 'view');
    const [formState, setFormState] = useState<Record<string, unknown>>({});
    const [refreshKey, setRefreshKey] = useState(0);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Fetch data
    const state = useAsync(async () => {
        return isCreateMode
            ? { data: null, error: null }
            : await database.from('tenants').select('*').eq('id', id).single();
    }, [id, refreshKey]);

    // Initialize formState when data loads
    useEffect(() => {
        state.value?.data && setFormState(state.value.data);
    }, [state.value?.data]);

    // Update mode when id changes
    useEffect(() => {
        setMode(isCreateMode ? 'create' : 'view');
    }, [id]);

    // Field change handler
    const updateField = (key: string, value: unknown) =>
        setFormState((prev) => ({ ...prev, [key]: value }));

    // Create mutation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [createState, handleCreate] = useAsyncFn(async () => {
        const scalarFields = Object.fromEntries(
            Object.entries(formState).filter(([_, v]) => typeof v !== 'object' || v === null)
        );
        return await database.from('tenants').insert(scalarFields as any).select().single();
    }, [formState]);

    // Update mutation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [updateState, handleUpdate] = useAsyncFn(async () => {
        const scalarFields = Object.fromEntries(
            Object.entries(formState).filter(([_, v]) => typeof v !== 'object' || v === null)
        );
        return await database.from('tenants').update(scalarFields as any).eq('id', id!).select().single();
    }, [formState, id]);

    // Delete mutation
    const [deleteState, handleDelete] = useAsyncFn(async () => {
        return await database.from('tenants').delete().eq('id', id!);
    }, [id]);

    // Handlers
    const handleSave = () => {
        if (isCreateMode) {
            handleCreate().then((result) => {
                result?.data && router.push(routes.landlord.tenants({ id: result.data.id as string }));
            });
        } else {
            handleUpdate().then((result) => {
                result?.data && (setMode('view'), setRefreshKey((p) => p + 1));
            });
        }
    };

    const handleCancel = () => {
        if (isCreateMode) {
            router.push(routes.landlord.tenants());
        } else {
            setMode('view');
            setFormState(state.value?.data ?? {});
        }
    };

    const handleDeleteConfirm = () => {
        handleDelete().then((result) => {
            !result?.error && router.push(routes.landlord.tenants());
        });
    };

    const handleRefresh = () => setRefreshKey((p) => p + 1);

    return (
        state.error
            ? <ErrorBanner msg={state.error.message} retry={handleRefresh} />
            : state.loading && !isCreateMode
                ? <Spinner />
                : state.value?.error
                    ? <ErrorBanner msg={state.value.error.message} />
                    : <div className={styles.viewSingleContainer}>
                        {/* Header with actions */}
                        {mode === 'view' && (
                            <div className={styles.sectionHeader}>
                                <h2 className={styles.sectionTitle}>Najemca</h2>
                                <div className={styles.actions}>
                                    <button
                                        className={styles.buttonPrimary}
                                        onClick={() => setMode('edit')}
                                    >
                                        Edytuj
                                    </button>
                                    <button
                                        className={styles.buttonDanger}
                                        onClick={() => setShowDeleteConfirm(true)}
                                    >
                                        Usuń
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Main content */}
                        {mode === 'view' && (
                            <SingleRecordRead
                                values={formState}
                                hiddenColumns={['id', 'user_id', 'created_by', 'updated_at']}
                            />
                        )}

                        {(mode === 'edit' || mode === 'create') && (
                            <SingleRecordEdit
                                values={formState}
                                onChange={updateField}
                                hiddenColumns={['id', 'user_id', 'created_by', 'updated_at']}
                                onSubmit={handleSave}
                                onCancel={handleCancel}
                                submitLabel={isCreateMode ? 'Utwórz' : 'Zapisz'}
                                loading={createState.loading || updateState.loading}
                            />
                        )}

                        {/* Create/Edit errors */}
                        {createState.error && <ErrorBanner msg={createState.error.message} />}
                        {createState.value?.error && <ErrorBanner msg={createState.value.error.message} />}
                        {updateState.error && <ErrorBanner msg={updateState.error.message} />}
                        {updateState.value?.error && <ErrorBanner msg={updateState.value.error.message} />}

                        {/* Related records - only in view/edit mode (not create) */}
                        {!isCreateMode && (
                            <ManyRecords
                                label="Umowy najmu"
                                query={() => database.from('lease_agreements').select('*').eq('tenant_id', id!)}
                                hiddenColumns={['id', 'tenant_id', 'created_by', 'updated_at', 'notes']}
                                onRowClick={(row) => router.push(routes.landlord.leases({ id: row.id as string }))}
                                refreshKey={refreshKey}
                            />
                        )}

                        {/* Delete confirmation */}
                        {showDeleteConfirm && (
                            <ConfirmDialog
                                message="Czy na pewno chcesz usunąć tego najemcę?"
                                onConfirm={handleDeleteConfirm}
                                onCancel={() => setShowDeleteConfirm(false)}
                                loading={deleteState.loading}
                            />
                        )}
                    </div>
    );
};