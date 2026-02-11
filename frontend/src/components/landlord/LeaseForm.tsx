'use client';

import { useState } from 'react';
import { useAsync, useAsyncFn } from 'react-use';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { database } from '@/api/database';
import { Spinner } from '@/components/shared/Spinner';
import { ErrorBanner } from '@/components/shared/ErrorBanner';

import styles from './LeaseForm.module.css';

interface LeaseFormProps {
    id?: string;
}

export const LeaseForm = ({ id }: LeaseFormProps) => {
    const router = useRouter();
    const isEdit = !!id;

    const [tenantId, setTenantId] = useState('');
    const [propertyId, setPropertyId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [monthlyRent, setMonthlyRent] = useState('');
    const [depositAmount, setDepositAmount] = useState('');
    const [status, setStatus] = useState('active');
    const [notes, setNotes] = useState('');

    const tenantsState = useAsync(async () => {
        const { data, error } = await database
            .from('tenants')
            .select('id, first_name, last_name')
            .eq('status', 'active')
            .order('last_name');
        return { data, error };
    }, []);

    const propertiesState = useAsync(async () => {
        const { data, error } = await database
            .from('properties')
            .select('id, name, address, status')
            .order('name');
        return { data, error };
    }, []);

    const loadState = useAsync(async () => {
        return id
            ? database
                .from('lease_agreements')
                .select('*')
                .eq('id', id)
                .single()
                .then(({ data, error }) => {
                    data && (
                        setTenantId(data.tenant_id),
                        setPropertyId(data.property_id),
                        setStartDate(data.start_date),
                        setEndDate(data.end_date ?? ''),
                        setMonthlyRent(data.monthly_rent.toString()),
                        setDepositAmount(data.deposit_amount.toString()),
                        setStatus(data.status),
                        setNotes(data.notes ?? '')
                    );
                    return { data, error };
                })
            : { data: null, error: null };
    }, [id]);

    const [submitState, handleSubmit] = useAsyncFn(async () => {
        const payload = {
            tenant_id: tenantId,
            property_id: propertyId,
            start_date: startDate,
            end_date: endDate || null,
            monthly_rent: parseFloat(monthlyRent),
            deposit_amount: parseFloat(depositAmount),
            status,
            notes: notes || null,
        };

        const { error } = isEdit
            ? await database.from('lease_agreements').update(payload).eq('id', id!)
            : await database.from('lease_agreements').insert(payload);

        !error && router.push('/landlord/leases');
        return { error };
    }, [tenantId, propertyId, startDate, endDate, monthlyRent, depositAmount, status, notes, id, isEdit, router]);

    const tenants = tenantsState.value?.data ?? [];
    const properties = propertiesState.value?.data ?? [];
    const isDataLoading = tenantsState.loading || propertiesState.loading || loadState.loading;

    return (
        <div className={styles.page}>
            <Link href="/landlord/leases" className={styles.backLink}>← Powrót do listy</Link>

            <h1 className={styles.title}>{isEdit ? 'Edytuj umowę najmu' : 'Nowa umowa najmu'}</h1>

            {isDataLoading ? <Spinner /> :
                loadState.error ? <ErrorBanner msg={loadState.error.message} /> :
                    loadState.value?.error ? <ErrorBanner msg={loadState.value.error.message} /> :
                        <form className={styles.form} onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                            {(submitState.error || submitState.value?.error) && (
                                <div className={styles.errorSection}>
                                    {submitState.error && <ErrorBanner msg={submitState.error.message} />}
                                    {submitState.value?.error && <ErrorBanner msg={submitState.value.error.message} />}
                                </div>
                            )}

                            <div className={styles.formField}>
                                <label htmlFor="tenantId">Najemca</label>
                                <select
                                    id="tenantId"
                                    value={tenantId}
                                    onChange={(e) => setTenantId(e.target.value)}
                                    required
                                >
                                    <option value="">— Wybierz najemcę —</option>
                                    {tenants.map(t => (
                                        <option key={t.id} value={t.id}>
                                            {t.first_name} {t.last_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className={styles.formField}>
                                <label htmlFor="propertyId">Nieruchomość</label>
                                <select
                                    id="propertyId"
                                    value={propertyId}
                                    onChange={(e) => setPropertyId(e.target.value)}
                                    required
                                >
                                    <option value="">— Wybierz nieruchomość —</option>
                                    {properties.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} ({p.address}) [{p.status}]
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className={styles.formField}>
                                <label htmlFor="startDate">Data rozpoczęcia</label>
                                <input
                                    id="startDate"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    required
                                />
                            </div>

                            <div className={styles.formField}>
                                <label htmlFor="endDate">Data zakończenia (opcjonalna)</label>
                                <input
                                    id="endDate"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>

                            <div className={styles.formField}>
                                <label htmlFor="monthlyRent">Czynsz miesięczny (PLN)</label>
                                <input
                                    id="monthlyRent"
                                    type="number"
                                    step="0.01"
                                    value={monthlyRent}
                                    onChange={(e) => setMonthlyRent(e.target.value)}
                                    required
                                    placeholder="np. 2500.00"
                                />
                            </div>

                            <div className={styles.formField}>
                                <label htmlFor="depositAmount">Kaucja (PLN)</label>
                                <input
                                    id="depositAmount"
                                    type="number"
                                    step="0.01"
                                    value={depositAmount}
                                    onChange={(e) => setDepositAmount(e.target.value)}
                                    required
                                    placeholder="np. 5000.00"
                                />
                            </div>

                            <div className={styles.formField}>
                                <label htmlFor="status">Status</label>
                                <select
                                    id="status"
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                >
                                    <option value="active">Aktywna</option>
                                    <option value="expired">Wygasła</option>
                                    <option value="terminated">Rozwiązana</option>
                                </select>
                            </div>

                            <div className={styles.formField}>
                                <label htmlFor="notes">Notatki</label>
                                <textarea
                                    id="notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Dodatkowe informacje..."
                                />
                            </div>

                            <button type="submit" className={styles.submitButton} disabled={submitState.loading}>
                                {submitState.loading ? 'Zapisywanie...' : isEdit ? 'Zapisz zmiany' : 'Dodaj umowę'}
                            </button>
                        </form>
            }
        </div>
    );
};
