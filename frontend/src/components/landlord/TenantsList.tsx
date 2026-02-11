'use client';

import { useState } from 'react';
import { useAsync } from 'react-use';
import Link from 'next/link';

import { routes } from '@/routes';
import { database } from '@/api/database';
import { Spinner } from '@/components/shared/Spinner';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { EmptyState } from '@/components/shared/EmptyState';

const STATUS_LABELS: Record<string, string> = {
    active: 'Aktywny',
    past: 'Były',
    applicant: 'Kandydat',
};

export const TenantsList = () => {
    const [refreshKey, setRefreshKey] = useState(0);
    const handleRefresh = () => setRefreshKey(prev => prev + 1);

    const state = useAsync(async () => {
        const { data, error } = await database
            .from('tenants')
            .select('*')
            .order('created_at', { ascending: false });
        return { data, error };
    }, [refreshKey]);

    const tenants = state.value?.data ?? [];

    return (
        <div>
            <div>
                <h1>Najemcy</h1>
                <Link href={routes.landlord.tenants({ action: 'new' })}>
                    <button>Dodaj najemcę</button>
                </Link>
            </div>

            {state.error ? <ErrorBanner msg={state.error.message} retry={handleRefresh} /> :
                state.loading ? <Spinner /> :
                    state.value?.error ? <ErrorBanner msg={state.value.error.message} /> :
                        tenants.length === 0 ? (
                            <EmptyState
                                message="Brak najemców"
                                actionLabel="Dodaj pierwszego najemcę"
                                actionHref={routes.landlord.tenants({ action: 'new' })}
                            />
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Imię i nazwisko</th>
                                        <th>Email</th>
                                        <th>Telefon</th>
                                        <th>Status</th>
                                        <th>Akcje</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tenants.map(tenant => (
                                        <tr key={tenant.id}>
                                            <td>
                                                <Link href={routes.landlord.tenants({ id: tenant.id })}>
                                                    {tenant.first_name} {tenant.last_name}
                                                </Link>
                                            </td>
                                            <td>{tenant.email}</td>
                                            <td>{tenant.phone}</td>
                                            <td>{STATUS_LABELS[tenant.status] ?? tenant.status}</td>
                                            <td>
                                                <Link href={routes.landlord.tenants({ action: 'edit', id: tenant.id })}>
                                                    Edytuj
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
        </div>
    );
};
