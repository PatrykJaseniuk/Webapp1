'use client';

import { useState } from 'react';
import { useAsyncFn } from 'react-use';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { routes } from '@/routes';
import { database } from '@/api/database';
import { ErrorBanner } from '@/components/shared/ErrorBanner';

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
        <div>
            <div>
                <Link href={routes.landlord.utilityPrices()}>← Powrót do listy</Link>
            </div>

            <h1>Nowa cena medium</h1>

            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                {submitState.error && <ErrorBanner msg={submitState.error.message} />}
                {submitState.value?.error && <ErrorBanner msg={submitState.value.error.message} />}

                <div>
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

                <div>
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

                <div>
                    <label htmlFor="effectiveDate">Data obowiązywania od</label>
                    <input
                        id="effectiveDate"
                        type="date"
                        value={effectiveDate}
                        onChange={(e) => setEffectiveDate(e.target.value)}
                        required
                    />
                </div>

                <button type="submit" disabled={submitState.loading}>
                    {submitState.loading ? 'Zapisywanie...' : 'Dodaj cenę'}
                </button>
            </form>
        </div>
    );
};
