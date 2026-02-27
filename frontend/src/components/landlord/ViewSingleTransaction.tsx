'use client';
import { useState, useEffect } from 'react';
import { useAsync } from 'react-use';

import { database } from '@/api/database';
import { routes } from '@/routes';
import { useNavigate } from '@/routes/useNavigate';
import { SingleRecordDetails } from '@/components/coreComponents/SingleRecordDetails';
import { SingleRecordReference } from '@/components/coreComponents/SingleRecordReference';
import { Spinner } from '@/components/coreComponents/Spinner';
import { ErrorBanner } from '@/components/coreComponents/ErrorBanner';
import styles from '@/components/styles/viewSingle.module.css';

interface ViewSingleTransactionProps {
    id?: string;
}

export const ViewSingleTransaction = ({ id }: ViewSingleTransactionProps) => {
    const navigate = useNavigate();
    const isCreateMode = !id;
    const [refreshKey, setRefreshKey] = useState(0);
    const [fkState, setFkState] = useState<{ lease_id: string | null; property_id: string | null }>({
        lease_id: null,
        property_id: null,
    });

    // Fetch transaction with relations
    const state = useAsync(async () =>
        isCreateMode
            ? { data: null, error: null }
            : await database.from('transactions').select('*').eq('id', id).single()
    , [id, refreshKey]);

    // Initialize FK state when data loads
    useEffect(() => {
        const data = state.value?.data as Record<string, unknown> | null;
        data && setFkState({
            lease_id: data.lease_id as string | null,
            property_id: data.property_id as string | null,
        });
    }, [state.value?.data]);

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
                            tableName="transactions"
                            hiddenColumns={['id', 'lease_id', 'property_id', 'created_by', 'updated_at']}
                            label="Transakcja"
                            onSave={(record) => navigate(routes.landlord.transactions({ id: record.id as string }))}
                            onDelete={() => navigate(routes.landlord.transactions())}
                            refreshKey={refreshKey}
                        />

                        <SingleRecordReference
                            label="Umowa najmu"
                            referenceId={fkState.lease_id}
                            onChange={(newId) => setFkState((prev) => ({ ...prev, lease_id: newId }))}
                            query={(refId) => database.from('lease_agreements').select('*').eq('id', refId).single()}
                            pickerQuery={() => database.from('lease_agreements').select('*')}
                            pickerTableName="lease_agreements"
                            navigateTo={(refId) => routes.landlord.leases({ id: refId })}
                            nullable={true}
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
                            nullable={true}
                            mode={id ? 'view' : 'create'}
                        />
                    </div>
    );
};