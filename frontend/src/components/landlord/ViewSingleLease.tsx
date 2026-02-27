'use client';
import { useState, useEffect } from 'react';
import { useAsync, useAsyncFn } from 'react-use';

import { database } from '@/api/database';
import { routes } from '@/routes';
import { useNavigate } from '@/routes/useNavigate';
import { SingleRecordDetails } from '@/components/coreComponents/SingleRecordDetails';
import { SingleRecordReference } from '@/components/coreComponents/SingleRecordReference';
import { ManyRecords } from '@/components/coreComponents/ManyRecords';
import { Spinner } from '@/components/coreComponents/Spinner';
import { ErrorBanner } from '@/components/coreComponents/ErrorBanner';
import { ConfirmDialog } from '@/components/coreComponents/ConfirmDialog';
import styles from '@/components/styles/viewSingle.module.css';

interface ViewSingleLeaseProps {
    id?: string;
}

export const ViewSingleLease = ({ id }: ViewSingleLeaseProps) => {
    const navigate = useNavigate();
    const isCreateMode = !id;
    const [refreshKey, setRefreshKey] = useState(0);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [fkState, setFkState] = useState<{ tenant_id: string | null; property_id: string | null }>({
        tenant_id: null,
        property_id: null,
    });

    // Fetch lease with relations
    const state = useAsync(async () =>
        isCreateMode
            ? { data: null, error: null }
            : await database.from('lease_agreements').select('*, properties(*), tenants(*)').eq('id', id).single()
    , [id, refreshKey]);

    // Initialize FK state when data loads
    useEffect(() => {
        const data = state.value?.data as Record<string, unknown> | null;
        data && setFkState({
            tenant_id: data.tenant_id as string | null,
            property_id: data.property_id as string | null,
        });
    }, [state.value?.data]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [saveState, handleSave] = useAsyncFn(async (scalarFields: Record<string, unknown>) => {
        const table = database.from('lease_agreements') as any;
        const payload = { ...scalarFields, tenant_id: fkState.tenant_id, property_id: fkState.property_id };
        return isCreateMode
            ? await table.insert(payload).select().single()
            : await table.update(payload).eq('id', id!).select().single();
    }, [fkState, id]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [deleteState, handleDelete] = useAsyncFn(async () => {
        const table = database.from('lease_agreements') as any;
        return await table.delete().eq('id', id);
    }, [id]);

    const handleRefresh = () => setRefreshKey((p) => p + 1);

    return (
        state.error
            ? <ErrorBanner msg={state.error.message} retry={handleRefresh} />
            : state.loading
                ? <Spinner />
                : state.value?.error
                    ? <ErrorBanner msg={state.value.error.message} />
                    : <div className={styles.viewSingleContainer}>
                        <SingleRecordDetails
                            id={id}
                            tableName="lease_agreements"
                            select="*"
                            hiddenColumns={['id', 'tenant_id', 'property_id', 'created_by', 'updated_at']}
                            label="Umowa najmu"
                            onSave={(record) => navigate(routes.landlord.leases({ id: record.id as string }))}
                            onDelete={() => navigate(routes.landlord.leases())}
                            refreshKey={refreshKey}
                        />

                        <SingleRecordReference
                            label="Najemca"
                            referenceId={fkState.tenant_id}
                            onChange={(newId) => setFkState((prev) => ({ ...prev, tenant_id: newId }))}
                            query={(refId) => database.from('tenants').select('*').eq('id', refId).single()}
                            pickerQuery={() => database.from('tenants').select('*')}
                            pickerTableName="tenants"
                            navigateTo={(refId) => routes.landlord.tenants({ id: refId })}
                            nullable={false}
                            mode={id ? 'view' : 'create'}
                        />

                        <SingleRecordReference
                            label="Nieruchomość"
                            referenceId={fkState.property_id}
                            onChange={(newId) => setFkState((prev) => ({ ...prev, property_id: newId }))}
                            query={(refId) => database.from('properties').select('*').eq('id', refId).single()}
                            pickerQuery={() => database.from('properties').select('*')}
                            pickerTableName="properties"
                            navigateTo={(refId) => routes.landlord.properties({ id: refId })}
                            nullable={false}
                            mode={id ? 'view' : 'create'}
                        />

                        <ManyRecords
                            label="Transakcje"
                            query={() => database.from('transactions').select('*').eq('lease_id', id!)}
                            hiddenColumns={['id', 'lease_id', 'property_id', 'created_by', 'updated_at']}
                            defaultSortKey="due_date"
                            defaultSortDirection="desc"
                            onRowClick={(row) => navigate(routes.landlord.transactions({ id: row.id as string }))}
                            disabled={isCreateMode}
                            disabledMessage="Zapisz umowę, aby dodać transakcje"
                            refreshKey={refreshKey}
                        />

                        {showDeleteConfirm && (
                            <ConfirmDialog
                                message="Czy na pewno chcesz usunąć tę umowę najmu?"
                                onConfirm={() => handleDelete().then(() => navigate(routes.landlord.leases()))}
                                onCancel={() => setShowDeleteConfirm(false)}
                                loading={deleteState.loading}
                            />
                        )}
                    </div>
    );
};