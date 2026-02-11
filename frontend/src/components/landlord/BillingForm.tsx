'use client';

import { useState } from 'react';
import { useAsync, useAsyncFn } from 'react-use';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { routes } from '@/routes';
import { database } from '@/api/database';
import { Spinner } from '@/components/shared/Spinner';
import { ErrorBanner } from '@/components/shared/ErrorBanner';

export const BillingForm = () => {
    const router = useRouter();

    const [leaseId, setLeaseId] = useState('');
    const [itemType, setItemType] = useState('rent');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [dueDate, setDueDate] = useState('');

    const leasesState = useAsync(async () => {
        const { data, error } = await database
            .from('active_leases')
            .select('id, property_name, tenant_name');
        return { data, error };
    }, []);

    const [submitState, handleSubmit] = useAsyncFn(async () => {
        const payload = {
            lease_id: leaseId,
            item_type: itemType,
            description,
            amount: parseFloat(amount),
            due_date: dueDate,
        };

        const { error } = await database.from('billing_items').insert(payload);
        !error && router.push(routes.landlord.billing());
        return { error };
    }, [leaseId, itemType, description, amount, dueDate, router]);

    const leases = leasesState.value?.data ?? [];

    return (
        <div>
            <div>
                <Link href={routes.landlord.billing()}>← Powrót do listy</Link>
            </div>

            <h1>Nowa pozycja rozliczeniowa</h1>

            {leasesState.loading ? <Spinner /> :
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                    {submitState.error && <ErrorBanner msg={submitState.error.message} />}
                    {submitState.value?.error && <ErrorBanner msg={submitState.value.error.message} />}

                    <div>
                        <label htmlFor="leaseId">Umowa najmu</label>
                        <select
                            id="leaseId"
                            value={leaseId}
                            onChange={(e) => setLeaseId(e.target.value)}
                            required
                        >
                            <option value="">— Wybierz umowę —</option>
                            {leases.map(l => (
                                <option key={l.id} value={l.id!}>
                                    {l.property_name} — {l.tenant_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="itemType">Typ</label>
                        <select
                            id="itemType"
                            value={itemType}
                            onChange={(e) => setItemType(e.target.value)}
                        >
                            <option value="rent">Czynsz</option>
                            <option value="utility">Media</option>
                            <option value="deposit">Kaucja</option>
                            <option value="fee">Opłata</option>
                            <option value="other">Inne</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="description">Opis</label>
                        <input
                            id="description"
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                            placeholder="np. Czynsz za styczeń 2026"
                        />
                    </div>

                    <div>
                        <label htmlFor="amount">Kwota (PLN)</label>
                        <input
                            id="amount"
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                            placeholder="np. 2500.00"
                        />
                    </div>

                    <div>
                        <label htmlFor="dueDate">Termin płatności</label>
                        <input
                            id="dueDate"
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" disabled={submitState.loading}>
                        {submitState.loading ? 'Zapisywanie...' : 'Dodaj pozycję'}
                    </button>
                </form>
            }
        </div>
    );
};
