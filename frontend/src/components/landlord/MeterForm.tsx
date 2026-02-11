'use client';

import { useState } from 'react';
import { useAsync, useAsyncFn } from 'react-use';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { routes } from '@/routes';
import { database } from '@/api/database';
import { Spinner } from '@/components/shared/Spinner';
import { ErrorBanner } from '@/components/shared/ErrorBanner';

import styles from './MeterForm.module.css';

export const MeterForm = () => {
    const router = useRouter();

    const [propertyId, setPropertyId] = useState('');
    const [meterType, setMeterType] = useState('electricity');
    const [meterNumber, setMeterNumber] = useState('');
    const [unit, setUnit] = useState('kwh');
    const [active, setActive] = useState(true);

    const propertiesState = useAsync(async () => {
        const { data, error } = await database
            .from('properties')
            .select('id, name, address')
            .order('name');
        return { data, error };
    }, []);

    const [submitState, handleSubmit] = useAsyncFn(async () => {
        const payload = {
            property_id: propertyId,
            meter_type: meterType,
            meter_number: meterNumber,
            unit,
            active,
        };

        const { error } = await database.from('meters').insert(payload);
        !error && router.push(routes.landlord.meters());
        return { error };
    }, [propertyId, meterType, meterNumber, unit, active, router]);

    const properties = propertiesState.value?.data ?? [];

    return (
        <div className={styles.page}>
            <Link href={routes.landlord.meters()} className={styles.backLink}>← Powrót do listy</Link>

            <h1 className={styles.title}>Nowy licznik</h1>

            {propertiesState.loading ? <Spinner /> :
                <form className={styles.form} onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                    {(submitState.error || submitState.value?.error) && (
                        <div className={styles.errorSection}>
                            {submitState.error && <ErrorBanner msg={submitState.error.message} />}
                            {submitState.value?.error && <ErrorBanner msg={submitState.value.error.message} />}
                        </div>
                    )}

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
                                    {p.name} ({p.address})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.formField}>
                        <label htmlFor="meterType">Typ licznika</label>
                        <select
                            id="meterType"
                            value={meterType}
                            onChange={(e) => {
                                setMeterType(e.target.value);
                                setUnit(e.target.value === 'electricity' ? 'kwh' : 'm3');
                            }}
                        >
                            <option value="electricity">Prąd</option>
                            <option value="water">Woda</option>
                            <option value="gas">Gaz</option>
                            <option value="heating">Ogrzewanie</option>
                        </select>
                    </div>

                    <div className={styles.formField}>
                        <label htmlFor="meterNumber">Numer licznika</label>
                        <input
                            id="meterNumber"
                            type="text"
                            value={meterNumber}
                            onChange={(e) => setMeterNumber(e.target.value)}
                            required
                            placeholder="np. E-12345"
                        />
                    </div>

                    <div className={styles.formField}>
                        <label htmlFor="unit">Jednostka</label>
                        <select
                            id="unit"
                            value={unit}
                            onChange={(e) => setUnit(e.target.value)}
                        >
                            <option value="kwh">kWh</option>
                            <option value="m3">m³</option>
                        </select>
                    </div>

                    <div className={styles.checkboxField}>
                        <input
                            id="active"
                            type="checkbox"
                            checked={active}
                            onChange={(e) => setActive(e.target.checked)}
                        />
                        <label htmlFor="active">Aktywny</label>
                    </div>

                    <button type="submit" className={styles.submitButton} disabled={submitState.loading}>
                        {submitState.loading ? 'Zapisywanie...' : 'Dodaj licznik'}
                    </button>
                </form>
            }
        </div>
    );
};