'use client';

import { useState, useEffect } from 'react';
import { useAsync, useAsyncFn } from 'react-use';

import { routes } from '@/api/routes/appRoutes';
import { useRouter } from 'next/navigation';
import { database } from '@/api/database';
import { SingleRecord } from '@/components/coreComponents/SingleRecord';
import { ManyRecords } from '@/components/coreComponents/ManyRecords';
import { Spinner } from '@/components/coreComponents/Spinner';
import { ErrorBanner } from '@/components/coreComponents/ErrorBanner';
import styles from '@/components/styles/viewSingle.module.css';

type PageSingleRecordProps =
    { id: string }

export const PageSingleProperty = ({ id }: PageSingleRecordProps) => {
    const router = useRouter();
    const [refreshKey, setRefreshKey] = useState(0);
    const refresh = () => setRefreshKey((key) => key + 1)


    const state = useAsync(
        async () => await database.from('properties').select('*').eq('id', id).single(),
        [id, refreshKey]);

    const [saveState, saveFn] = useAsyncFn(
        async (updated: Record<string, unknown>) => {
            const dbResult = await database
                .from('properties')
                .update(updated)
                .eq('id', id)
                .select()
                .single();
            refresh();
            return dbResult
        },
        [id]
    );

    const saveLoading = saveState.loading;
    const saveError = saveState.error;

    const loading = state.loading && saveState.loading
    const error = state.error?.message ?? state.value?.error?.message ?? saveState.error?.message ?? saveState.value?.error?.message;
    const data = state.value?.data ?? {}

    return (
        loading ?
            <Spinner /> :
            error ?
                <ErrorBanner msg={error} /> :
                <div className={styles.viewSingleContainer}>

                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Nieruchomość</h2>
                    </div>

                    {saveError && <ErrorBanner msg={saveError.message} />}

                    <SingleRecord
                        fields={data}
                        tableName="properties"
                        recordId={id}
                        onSave={saveFn}
                    />


                    <ManyRecords
                        label="Umowy najmu"
                        query={() => database.from('lease_agreements').select('*').eq('property_id', id)}
                        hiddenColumns={['id', 'property_id', 'created_by', 'updated_at', 'notes']}
                        onRowClick={(row) => router.push(routes.landlord.leases({ id: row.id as string }))}
                    />

                    <ManyRecords
                        label="Transakcje"
                        query={() => database.from('transactions').select('*').eq('property_id', id)}
                        hiddenColumns={['id', 'property_id', 'lease_id', 'created_by', 'updated_at']}
                        defaultSortKey="due_date"
                        defaultSortDirection="desc"
                        onRowClick={(row) => router.push(routes.landlord.transactions({ id: row.id as string }))}
                    />
                </div>

    )

};

