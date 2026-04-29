'use client';

import { useState, useEffect } from 'react';
import { useAsync, useAsyncFn } from 'react-use';

import { routes } from '@/routes';
import { useRouter } from 'next/navigation';
import { database } from '@/api/database';
import { SingleRecord } from '@/components/coreComponents/SingleRecordRead';
import { ManyRecords } from '@/components/coreComponents/ManyRecords';
import { Spinner } from '@/components/coreComponents/Spinner';
import { ErrorBanner } from '@/components/coreComponents/ErrorBanner';
import styles from '@/components/styles/viewSingle.module.css';

type PageSingleRecordProps =
    { id: string }

export const PageSingleProperty = ({ id }: PageSingleRecordProps) => {
    const router = useRouter();

    const state = useAsync(
        async () => await database.from('properties').select('*').eq('id', id).single(),
        [id]);

    const loading = state.loading
    const error = state.error?.message ?? state.value?.error?.message ?? "";
    const data = state.value?.data ?? {}


    const modeDiscriptor = loading ? "loading" : error ? "error" : "data"

    const modeSelector = {
        loading:
            <Spinner />,
        error:
            <ErrorBanner msg={error} />,
        data:
            <div className={styles.viewSingleContainer}>

                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Nieruchomość</h2>
                </div>


                <SingleRecord
                    fields={data}
                // hiddenColumns={['id', 'created_by', 'updated_at']}
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
    }

    return modeSelector[modeDiscriptor]

};

