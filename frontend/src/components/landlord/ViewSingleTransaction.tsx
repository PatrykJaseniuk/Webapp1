'use client';

import { useState, useEffect } from 'react';
import { useAsync, useAsyncFn } from 'react-use';

import { database } from '@/api/database';
import { routes } from '@/routes';
import { useRouter } from 'next/navigation';
import { SingleRecordRead } from '@/components/coreComponents/SingleRecordRead';
import { SingleRecordEdit } from '@/components/coreComponents/SingleRecordEdit';
import { SingleRecordReference } from '@/components/coreComponents/SingleRecordReference';
import { Spinner } from '@/components/coreComponents/Spinner';
import { ErrorBanner } from '@/components/coreComponents/ErrorBanner';
import { ConfirmDialog } from '@/components/coreComponents/ConfirmDialog';
import styles from '@/components/styles/viewSingle.module.css';

interface ViewSingleTransactionProps {
    id?: string;
}

export const ViewSingleTransaction = ({ id }: ViewSingleTransactionProps) => {
    const router = useRouter();
    const isCreateMode = !id;
    const [mode, setMode] = useState<'view' | 'edit' | 'create'>(isCreateMode ? 'create' : 'view');
    const [formState, setFormState] = useState<Record<string, unknown>>({});
    const [fkState, setFkState] = useState<{ lease_id: string | null; property_id: string | null }>({
        lease_id: null,
        property_id: null,
    });
    const [refreshKey, setRefreshKey] = useState(0);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Fetch transaction with relations
    const state = useAsync(async () =>
        isCreateMode
            ? { data: null, error: null }
            : await database.from('transactions').select('*').eq('id', id).single()
    , [id, refreshKey]);

    // Initialize formState and FK state when data loads
    useEffect(() => {
        const data = state.value?.data as Record<string, unknown> | null;
        if (data) {
            setFormState(data);
            setFkState({
                lease_id: data.lease_id as string | null,
                property_id: data.property_id as string | null,
            });
        }
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
        const payload = { ...scalarFields, lease_id: fkState.lease_id, property_id: fkState.property_id } as any;
        return await database.from('transactions').insert(payload).select().single();
    }, [formState, fkState]);

    // Update mutation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [updateState, handleUpdate] = useAsyncFn(async () => {
        const scalarFields = Object.fromEntries(
            Object.entries(formState).filter(([_, v]) => typeof v !== 'object' || v === null)
        );
        const payload = { ...scalarFields, lease_id: fkState.lease_id, property_id: fkState.property_id } as any;
        return await database.from('transactions').update(payload).eq('id', id!).select().single();
    }, [formState, fkState, id]);

    // Delete mutation
    const [deleteState, handleDelete] = useAsyncFn(async () => {
        return await database.from('transactions').delete().eq('id', id!);
    }, [id]);

    // Handlers
    const handleSave = () => {
        if (isCreateMode) {
            handleCreate().then((result) => {
                result?.data && router.push(routes.landlord.transactions({ id: result.data.id as string }));
            });
        } else {
            handleUpdate().then((result) => {
                result?.data && (setMode('view'), setRefreshKey((p) => p + 1));
            });
        }
    };

    const handleCancel = () => {
        if (isCreateMode) {
            router.push(routes.landlord.transactions());
        } else {
            setMode('view');
            setFormState(state.value?.data ?? {});
            const data = state.value?.data as Record<string, unknown> | null;
            if (data) {
                setFkState({
                    lease_id: data.lease_id as string | null,
                    property_id: data.property_id as string | null,
                });
            }
        }
    };

    const handleDeleteConfirm = () => {
        handleDelete().then((result) => {
            !result?.error && router.push(routes.landlord.transactions());
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
                                <h2 className={styles.sectionTitle}>Transakcja</h2>
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
                                hiddenColumns={['id', 'lease_id', 'property_id', 'created_by', 'updated_at']}
                            />
                        )}

                        {(mode === 'edit' || mode === 'create') && (
                            <SingleRecordEdit
                                values={formState}
                                onChange={updateField}
                                hiddenColumns={['id', 'lease_id', 'property_id', 'created_by', 'updated_at']}
                                onSubmit={handleSave}
                                onCancel={handleCancel}
                                submitLabel={isCreateMode ? 'Utwórz' : 'Zapisz'}
                                loading={createState.loading || updateState.loading}
                            />
                        )}

                        {/* FK: Lease reference */}
                        <SingleRecordReference
                            label="Umowa najmu"
                            referenceId={fkState.lease_id}
                            onChange={(newId) => setFkState((prev) => ({ ...prev, lease_id: newId }))}
                            query={(refId) => database.from('lease_agreements').select('*').eq('id', refId).single()}
                            pickerQuery={() => database.from('lease_agreements').select('*')}
                            pickerTableName="lease_agreements"
                            navigateTo={(refId) => routes.landlord.leases({ id: refId })}
                            nullable={true}
                            mode={mode}
                        />

                        {/* FK: Property reference */}
                        <SingleRecordReference
                            label="Nieruchomość"
                            referenceId={fkState.property_id}
                            onChange={(newId) => setFkState((prev) => ({ ...prev, property_id: newId }))}
                            query={(refId) => database.from('properties').select('*').eq('id', refId).single()}
                            pickerQuery={() => database.from('properties').select('*')}
                            pickerTableName="properties"
                            navigateTo={(refId) => routes.landlord.properties({ id: refId })}
                            nullable={true}
                            mode={mode}
                        />

                        {/* Create/Edit errors */}
                        {createState.error && <ErrorBanner msg={createState.error.message} />}
                        {createState.value?.error && <ErrorBanner msg={createState.value.error.message} />}
                        {updateState.error && <ErrorBanner msg={updateState.error.message} />}
                        {updateState.value?.error && <ErrorBanner msg={updateState.value.error.message} />}

                        {/* Delete confirmation */}
                        {showDeleteConfirm && (
                            <ConfirmDialog
                                message="Czy na pewno chcesz usunąć tę transakcję?"
                                onConfirm={handleDeleteConfirm}
                                onCancel={() => setShowDeleteConfirm(false)}
                                loading={deleteState.loading}
                            />
                        )}
                    </div>
    );
};