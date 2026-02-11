'use client';

import { useState } from 'react';
import { useAsync } from 'react-use';
import Link from 'next/link';

import { database } from '@/api/database';
import { Spinner } from '@/components/shared/Spinner';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';

const STATUS_LABELS: Record<string, string> = {
    active: 'Aktywny',
    past: 'Były',
    applicant: 'Kandydat',
};

interface TenantDetailProps {
    id: string;
}

export const TenantDetail = ({ id }: TenantDetailProps) => {
    const [refreshKey, setRefreshKey] = useState(0);
    const handleRefresh = () => setRefreshKey(prev => prev + 1);

    const state = useAsync(async () => {
        const { data, error } = await database
            .from('tenants')
            .select('*')
            .eq('id', id)
            .single();
        return { data, error };
    }, [id, refreshKey]);

    const leasesState = useAsync(async () => {
        const { data, error } = await database
            .from('lease_agreements')
            .select('*, properties(name, address)')
            .eq('tenant_id', id)
            .order('start_date', { ascending: false });
        return { data, error };
    }, [id, refreshKey]);

    const billingState = useAsync(async () => {
        const { data: leases } = await database
            .from('lease_agreements')
            .select('id')
            .eq('tenant_id', id);

        const leaseIds = (leases ?? []).map(l => l.id);

        return leaseIds.length > 0
            ? database
                .from('billing_with_payments')
                .select('*')
                .in('lease_id', leaseIds)
                .order('due_date', { ascending: false })
                .limit(10)
                .then(({ data, error }) => ({ data, error }))
            : { data: [], error: null };
    }, [id, refreshKey]);

    const tenant = state.value?.data;
    const leases = leasesState.value?.data ?? [];
    const billingItems = billingState.value?.data ?? [];

    const error = state.error ?? state.value?.error;

    return (
        <div>
            <div>
                <Link href="/landlord/tenants">← Powrót do listy</Link>
            </div>

            {error ? <ErrorBanner msg={error.message} retry={handleRefresh} /> :
                state.loading ? <Spinner /> :
                    !tenant ? <ErrorBanner msg="Nie znaleziono najemcy" /> :
                        <>
                            <div>
                                <h1>{tenant.first_name} {tenant.last_name}</h1>
                                <Link href={`/landlord/tenants?action=edit&id=${id}`}>
                                    <button>Edytuj</button>
                                </Link>
                            </div>

                            <div>
                                <div>
                                    <h3>Dane kontaktowe</h3>
                                    <dl>
                                        <dt>Email</dt>
                                        <dd>{tenant.email}</dd>
                                        <dt>Telefon</dt>
                                        <dd>{tenant.phone}</dd>
                                        <dt>Status</dt>
                                        <dd>{STATUS_LABELS[tenant.status] ?? tenant.status}</dd>
                                        {tenant.id_document_number && (
                                            <>
                                                <dt>Nr dokumentu</dt>
                                                <dd>{tenant.id_document_number}</dd>
                                            </>
                                        )}
                                        {tenant.emergency_contact_name && (
                                            <>
                                                <dt>Kontakt awaryjny</dt>
                                                <dd>{tenant.emergency_contact_name} — {tenant.emergency_contact_phone}</dd>
                                            </>
                                        )}
                                        {tenant.notes && (
                                            <>
                                                <dt>Notatki</dt>
                                                <dd>{tenant.notes}</dd>
                                            </>
                                        )}
                                        <dt>Dodano</dt>
                                        <dd>{tenant.created_at ? formatDate(tenant.created_at) : '—'}</dd>
                                    </dl>
                                </div>
                            </div>

                            <div>
                                <h3>Umowy najmu ({leases.length})</h3>
                                {leasesState.loading ? <Spinner /> :
                                    leases.length === 0 ? (
                                        <EmptyState message="Brak umów najmu dla tego najemcy" />
                                    ) : (
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Nieruchomość</th>
                                                    <th>Okres</th>
                                                    <th>Czynsz</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {leases.map(lease => (
                                                    <tr key={lease.id}>
                                                        <td>
                                                            <Link href={`/landlord/properties?id=${lease.property_id}`}>
                                                                {(lease as any).properties?.name ?? lease.property_id}
                                                            </Link>
                                                        </td>
                                                        <td>{lease.start_date} — {lease.end_date ?? 'Bezterminowa'}</td>
                                                        <td>{formatCurrency(lease.monthly_rent)}</td>
                                                        <td>{lease.status}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                            </div>

                            {billingItems.length > 0 && (
                                <div>
                                    <h3>Ostatnie rozliczenia</h3>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Opis</th>
                                                <th>Kwota</th>
                                                <th>Zapłacono</th>
                                                <th>Saldo</th>
                                                <th>Termin</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {billingItems.map(item => (
                                                <tr key={item.id}>
                                                    <td>{item.description}</td>
                                                    <td>{formatCurrency(item.amount ?? 0)}</td>
                                                    <td>{formatCurrency(item.total_paid ?? 0)}</td>
                                                    <td>{formatCurrency(item.balance ?? 0)}</td>
                                                    <td>{item.due_date ? formatDate(item.due_date) : '—'}</td>
                                                    <td>{item.status}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
            }
        </div>
    );
};
