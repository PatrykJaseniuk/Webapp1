'use client';

import { useState, useEffect } from 'react';
import { useAsync, useAsyncFn } from 'react-use';

import { database } from '@/api/database';
import { routes } from '@/routes';
import { useRouter } from 'next/navigation';
import { SingleRecordRead } from '@/components/coreComponents/SingleRecordRead';
import { SingleRecordEdit } from '@/components/coreComponents/SingleRecordEdit';
import { SingleRecordReference } from '@/components/coreComponents/SingleRecordReference';
import { ManyRecords } from '@/components/coreComponents/ManyRecords';
import { Spinner } from '@/components/coreComponents/Spinner';
import { ErrorBanner } from '@/components/coreComponents/ErrorBanner';
import { ConfirmDialog } from '@/components/coreComponents/ConfirmDialog';
import styles from '@/components/styles/viewSingle.module.css';

interface ViewSingleLeaseProps {
    id: string;
}

export const ViewSingleLease = ({ id }: ViewSingleLeaseProps) => {
    const router = useRouter();
    const [refreshKey, setRefreshKey] = useState(0);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Fetch lease with relations
    const state = useAsync(async () =>
        await database.from('lease_agreements').select('*,properties(*), tenants(*), transactions(*)').eq('id', id).single()
        , [id, refreshKey]);

    // Delete mutation
    const [deleteState, handleDelete] = useAsyncFn(async () => {
        return await database.from('lease_agreements').delete().eq('id', id!);
    }, [id]);

    const handleDeleteConfirm = () => {
        handleDelete().then((result) => {
            !result?.error && router.push(routes.landlord.leases());
        });
    };

    const handleRefresh = () => setRefreshKey((p) => p + 1);

    return (
        state.error ?
            <ErrorBanner msg={state.error.message} retry={handleRefresh} />
            : state.loading ?
                <Spinner />
                : state.value?.error ?
                    <ErrorBanner msg={state.value.error.message} />
                    : state.value &&
                    <div className={styles.viewSingleContainer}>
                        {/* Header with actions */}

                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>Umowa najmu</h2>
                        </div>



                        <SingleRecordRead values={state.value.data} />

                        <ManyRecords
                            label="Transakcje"
                            query={() => database.from('transactions').select('*').eq('lease_id', id!)}
                            hiddenColumns={['id', 'lease_id', 'property_id', 'created_by', 'updated_at']}
                            defaultSortKey="due_date"
                            defaultSortDirection="desc"
                            onRowClick={(row) => router.push(routes.landlord.transactions({ id: row.id as string }))}
                            refreshKey={refreshKey}
                        />


                        {/* Delete confirmation */}
                        {showDeleteConfirm && (
                            <ConfirmDialog
                                message="Czy na pewno chcesz usunąć tę umowę najmu?"
                                onConfirm={handleDeleteConfirm}
                                onCancel={() => setShowDeleteConfirm(false)}
                                loading={deleteState.loading}
                            />
                        )}
                    </div>
    );
};