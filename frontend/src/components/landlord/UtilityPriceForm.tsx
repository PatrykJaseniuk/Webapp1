'use client';

import { useState } from 'react';
import { useAsyncFn } from 'react-use';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { routes } from '@/routes';
import { database } from '@/api/database';
import { ErrorBanner } from '@/components/shared/ErrorBanner';

import styles from './UtilityPriceForm.module.css';

export const UtilityPriceForm = () => {
    const router = useRouter();

    const [utilityType, setUtilityType] = useState('electricity');
    const [pricePerUnit, setPricePerUnit] = useState('');
    const [effectiveDate, setEffectiveDate] = useState('');

    const [submitState, handleSubmit] = useAsyncFn(async () => {
        const payload = {
            utility_type: utilityType,
            price_per_unit: parseFloat(pricePerUnit),
            effective_date: effectiveDate,
        };

        const { error } = await database.from('utility_prices').insert(payload);
        !error && router.push(routes.landlord.utilityPrices());
        return { error };
    }, [utilityType, pricePerUnit, effectiveDate, router]);

    return (
        <div className={styles.page}>
            <Link href={routes.landlord.utilityPrices()} className={styles.backLink}>← Powrót do listy</Link>

            <h1 className={styles.title}>Nowa cena medium</h1>

            <form className={styles.form} onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                {(submitState.error || submitState.value?.error) && (
                    <div className={styles.errorSection}>
                        {submitState.error && <ErrorBanner msg={submitState.error.message} />}
                        {submitState.value?.error && <ErrorBanner msg={submitState.value.error.message} />}
                    </div>
                )}

                <div className={styles.formField}>
                    <label htmlFor="utilityType">Typ medium</label>
                    <select
                        id="utilityType"
                        value={utilityType}
                        onChange={(e) => setUtilityType(e.target.value)}
                    >
                        <option value="electricity">Prąd</option>
                        <option value="water">Woda</option>
                        <option value="gas">Gaz</option>
                        <option value="heating">Ogrzewanie</option>
                    </select>
                </div>

                <div className={styles.formField}>
                    <label htmlFor="pricePerUnit">Cena za jednostkę (PLN)</label>
                    <input
                        id="pricePerUnit"
                        type="number"
                        step="0.0001"
                        value={pricePerUnit}
                        onChange={(e) => setPricePerUnit(e.target.value)}
                        required
                        placeholder="np. 0.8500"
                    />
                </div>

                <div className={styles.formField}>
                    <label htmlFor="effectiveDate">Data obowiązywania od</label>
                    <input
                        id="effectiveDate"
                        type="date"
                        value={effectiveDate}
                        onChange={(e) => setEffectiveDate(e.target.value)}
                        required
                    />
                </div>

                <button type="submit" className={styles.submitButton} disabled={submitState.loading}>
                    {submitState.loading ? 'Zapisywanie...' : 'Dodaj cenę'}
                </button>
            </form>
        </div>
    );
};
