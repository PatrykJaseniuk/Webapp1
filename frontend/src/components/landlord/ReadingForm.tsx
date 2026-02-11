'use client';

import { useState } from 'react';
import { useAsync, useAsyncFn } from 'react-use';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { routes } from '@/routes';
import { database } from '@/api/database';
import { Spinner } from '@/components/shared/Spinner';
import { ErrorBanner } from '@/components/shared/ErrorBanner';

import styles from './ReadingForm.module.css';

interface ReadingFormProps {
    meterId?: string;
}

export const ReadingForm = ({ meterId: initialMeterId }: ReadingFormProps) => {
    const router = useRouter();

    const [meterId, setMeterId] = useState(initialMeterId ?? '');
    const [readingValue, setReadingValue] = useState('');
    const [readingDate, setReadingDate] = useState('');
    const [notes, setNotes] = useState('');

    const metersState = useAsync(async () => {
        const { data, error } = await database
            .from('meters')
            .select('id, meter_type, meter_number, unit, properties(name)')
            .eq('active', true)
            .order('meter_type');
        return { data, error };
    }, []);

    const [submitState, handleSubmit] = useAsyncFn(async () => {
        const payload = {
            meter_id: meterId,
            reading_value: parseFloat(readingValue),
            reading_date: readingDate,
            notes: notes || null,
        };

        const { error } = await database.from('meter_readings').insert(payload);
        !error && router.push(routes.landlord.meters());
        return { error };
    }, [meterId, readingValue, readingDate, notes, router]);

    const meters = metersState.value?.data ?? [];

    return (
        <div className={styles.page}>
            <Link href={routes.landlord.meters()}>← Powrót do listy</Link>

            <h1 className={styles.title}>Nowy odczyt licznika</h1>

            {metersState.loading ? <Spinner /> :
                <form className={styles.form} onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                    {(submitState.error || submitState.value?.error) && (
                        <div className={styles.errorSection}>
                            {submitState.error && <ErrorBanner msg={submitState.error.message} />}
                            {submitState.value?.error && <ErrorBanner msg={submitState.value.error.message} />}
                        </div>
                    )}

                    <div className={styles.formField}>
                        <label htmlFor="meterId">Licznik</label>
                        <select
                            id="meterId"
                            value={meterId}
                            onChange={(e) => setMeterId(e.target.value)}
                            required
                        >
                            <option value="">— Wybierz licznik —</option>
                            {meters.map(m => (
                                <option key={m.id} value={m.id}>
                                    {(m as any).properties?.name} — {m.meter_type} ({m.meter_number})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.formField}>
                        <label htmlFor="readingValue">Wartość odczytu</label>
                        <input
                            id="readingValue"
                            type="number"
                            step="0.01"
                            value={readingValue}
                            onChange={(e) => setReadingValue(e.target.value)}
                            required
                            placeholder="np. 12345.67"
                        />
                    </div>

                    <div className={styles.formField}>
                        <label htmlFor="readingDate">Data odczytu</label>
                        <input
                            id="readingDate"
                            type="date"
                            value={readingDate}
                            onChange={(e) => setReadingDate(e.target.value)}
                            required
                        />
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
                        {submitState.loading ? 'Zapisywanie...' : 'Zapisz odczyt'}
                    </button>
                </form>
            }
        </div>
    );
};
