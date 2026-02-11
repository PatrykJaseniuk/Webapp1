'use client';

import { useState } from 'react';
import { useAsync, useAsyncFn } from 'react-use';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { routes } from '@/routes';
import { database } from '@/api/database';
import { Spinner } from '@/components/shared/Spinner';
import { ErrorBanner } from '@/components/shared/ErrorBanner';

import styles from './PropertyForm.module.css';

interface PropertyFormProps {
    id?: string;
}

export const PropertyForm = ({ id }: PropertyFormProps) => {
    const router = useRouter();
    const isEdit = !!id;

    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [propertyType, setPropertyType] = useState('apartment');
    const [sizeSqm, setSizeSqm] = useState('');
    const [bedrooms, setBedrooms] = useState('');
    const [monthlyRent, setMonthlyRent] = useState('');
    const [depositAmount, setDepositAmount] = useState('');
    const [status, setStatus] = useState('available');
    const [notes, setNotes] = useState('');

    const loadState = useAsync(async () => {
        return id
            ? database
                .from('properties')
                .select('*')
                .eq('id', id)
                .single()
                .then(({ data, error }) => {
                    data && (
                        setName(data.name),
                        setAddress(data.address),
                        setPropertyType(data.property_type),
                        setSizeSqm(data.size_sqm?.toString() ?? ''),
                        setBedrooms(data.bedrooms?.toString() ?? ''),
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
            name,
            address,
            property_type: propertyType,
            size_sqm: sizeSqm ? parseFloat(sizeSqm) : null,
            bedrooms: bedrooms ? parseInt(bedrooms, 10) : null,
            monthly_rent: parseFloat(monthlyRent),
            deposit_amount: parseFloat(depositAmount),
            status,
            notes: notes || null,
        };

        const { error } = isEdit
            ? await database.from('properties').update(payload).eq('id', id!)
            : await database.from('properties').insert(payload);

        !error && router.push(routes.landlord.properties());
        return { error };
    }, [name, address, propertyType, sizeSqm, bedrooms, monthlyRent, depositAmount, status, notes, id, isEdit, router]);

    return (
        <div className={styles.page}>
            <Link href={routes.landlord.properties()} className={styles.backLink}>← Powrót do listy</Link>

            <h1 className={styles.title}>{isEdit ? 'Edytuj nieruchomość' : 'Nowa nieruchomość'}</h1>

            {loadState.loading ? <Spinner /> :
                loadState.error ? <ErrorBanner msg={loadState.error.message} /> :
                    loadState.value?.error ? <ErrorBanner msg={loadState.value.error.message} /> :
                        <form className={styles.form} onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                            {submitState.error && <ErrorBanner msg={submitState.error.message} />}
                            {submitState.value?.error && <ErrorBanner msg={submitState.value.error.message} />}

                            <div className={styles.field}>
                                <label className={styles.label} htmlFor="name">Nazwa</label>
                                <input
                                    className={styles.input}
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    placeholder="np. Mieszkanie przy Marszałkowskiej"
                                />
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label} htmlFor="address">Adres</label>
                                <input
                                    className={styles.input}
                                    id="address"
                                    type="text"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    required
                                    placeholder="ul. Marszałkowska 10/5, Warszawa"
                                />
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label} htmlFor="propertyType">Typ nieruchomości</label>
                                <select
                                    className={styles.select}
                                    id="propertyType"
                                    value={propertyType}
                                    onChange={(e) => setPropertyType(e.target.value)}
                                >
                                    <option value="apartment">Mieszkanie</option>
                                    <option value="house">Dom</option>
                                    <option value="commercial">Lokal użytkowy</option>
                                    <option value="room">Pokój</option>
                                </select>
                            </div>

                            <div className={styles.grid}>
                                <div className={styles.field}>
                                    <label className={styles.label} htmlFor="sizeSqm">Powierzchnia (m²)</label>
                                    <input
                                        className={styles.input}
                                        id="sizeSqm"
                                        type="number"
                                        step="0.01"
                                        value={sizeSqm}
                                        onChange={(e) => setSizeSqm(e.target.value)}
                                        placeholder="np. 55.5"
                                    />
                                </div>

                                <div className={styles.field}>
                                    <label className={styles.label} htmlFor="bedrooms">Liczba sypialni</label>
                                    <input
                                        className={styles.input}
                                        id="bedrooms"
                                        type="number"
                                        value={bedrooms}
                                        onChange={(e) => setBedrooms(e.target.value)}
                                        placeholder="np. 2"
                                    />
                                </div>
                            </div>

                            <div className={styles.grid}>
                                <div className={styles.field}>
                                    <label className={styles.label} htmlFor="monthlyRent">Czynsz miesięczny (PLN)</label>
                                    <input
                                        className={styles.input}
                                        id="monthlyRent"
                                        type="number"
                                        step="0.01"
                                        value={monthlyRent}
                                        onChange={(e) => setMonthlyRent(e.target.value)}
                                        required
                                        placeholder="np. 2500.00"
                                    />
                                </div>

                                <div className={styles.field}>
                                    <label className={styles.label} htmlFor="depositAmount">Kaucja (PLN)</label>
                                    <input
                                        className={styles.input}
                                        id="depositAmount"
                                        type="number"
                                        step="0.01"
                                        value={depositAmount}
                                        onChange={(e) => setDepositAmount(e.target.value)}
                                        required
                                        placeholder="np. 5000.00"
                                    />
                                </div>
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label} htmlFor="status">Status</label>
                                <select
                                    className={styles.select}
                                    id="status"
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                >
                                    <option value="available">Wolna</option>
                                    <option value="occupied">Zajęta</option>
                                    <option value="inactive">Nieaktywna</option>
                                </select>
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label} htmlFor="notes">Notatki</label>
                                <textarea
                                    className={styles.textarea}
                                    id="notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={3}
                                    placeholder="Dodatkowe informacje..."
                                />
                            </div>

                            <button className={styles.button} type="submit" disabled={submitState.loading}>
                                {submitState.loading ? 'Zapisywanie...' : isEdit ? 'Zapisz zmiany' : 'Dodaj nieruchomość'}
                            </button>
                        </form>
            }
        </div>
    );
};
