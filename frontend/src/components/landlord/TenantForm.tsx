'use client';

import { useState } from 'react';
import { useAsync, useAsyncFn } from 'react-use';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { database } from '@/api/database';
import { Spinner } from '@/components/shared/Spinner';
import { ErrorBanner } from '@/components/shared/ErrorBanner';

interface TenantFormProps {
    id?: string;
}

export const TenantForm = ({ id }: TenantFormProps) => {
    const router = useRouter();
    const isEdit = !!id;

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [idDocumentNumber, setIdDocumentNumber] = useState('');
    const [emergencyContactName, setEmergencyContactName] = useState('');
    const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
    const [notes, setNotes] = useState('');
    const [status, setStatus] = useState('active');

    const loadState = useAsync(async () => {
        return id
            ? database
                .from('tenants')
                .select('*')
                .eq('id', id)
                .single()
                .then(({ data, error }) => {
                    data && (
                        setFirstName(data.first_name),
                        setLastName(data.last_name),
                        setEmail(data.email),
                        setPhone(data.phone),
                        setIdDocumentNumber(data.id_document_number ?? ''),
                        setEmergencyContactName(data.emergency_contact_name ?? ''),
                        setEmergencyContactPhone(data.emergency_contact_phone ?? ''),
                        setNotes(data.notes ?? ''),
                        setStatus(data.status)
                    );
                    return { data, error };
                })
            : { data: null, error: null };
    }, [id]);

    const [submitState, handleSubmit] = useAsyncFn(async () => {
        const payload = {
            first_name: firstName,
            last_name: lastName,
            email,
            phone,
            id_document_number: idDocumentNumber || null,
            emergency_contact_name: emergencyContactName || null,
            emergency_contact_phone: emergencyContactPhone || null,
            notes: notes || null,
            status,
        };

        const { error } = isEdit
            ? await database.from('tenants').update(payload).eq('id', id!)
            : await database.from('tenants').insert(payload);

        !error && router.push('/landlord/tenants');
        return { error };
    }, [firstName, lastName, email, phone, idDocumentNumber, emergencyContactName, emergencyContactPhone, notes, status, id, isEdit, router]);

    return (
        <div>
            <div>
                <Link href="/landlord/tenants">← Powrót do listy</Link>
            </div>

            <h1>{isEdit ? 'Edytuj najemcę' : 'Nowy najemca'}</h1>

            {loadState.loading ? <Spinner /> :
                loadState.error ? <ErrorBanner msg={loadState.error.message} /> :
                    loadState.value?.error ? <ErrorBanner msg={loadState.value.error.message} /> :
                        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                            {submitState.error && <ErrorBanner msg={submitState.error.message} />}
                            {submitState.value?.error && <ErrorBanner msg={submitState.value.error.message} />}

                            <div>
                                <label htmlFor="firstName">Imię</label>
                                <input
                                    id="firstName"
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    required
                                    placeholder="Jan"
                                />
                            </div>

                            <div>
                                <label htmlFor="lastName">Nazwisko</label>
                                <input
                                    id="lastName"
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    required
                                    placeholder="Kowalski"
                                />
                            </div>

                            <div>
                                <label htmlFor="email">Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="jan@example.com"
                                />
                            </div>

                            <div>
                                <label htmlFor="phone">Telefon</label>
                                <input
                                    id="phone"
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    required
                                    placeholder="+48 123 456 789"
                                />
                            </div>

                            <div>
                                <label htmlFor="idDocumentNumber">Nr dokumentu tożsamości</label>
                                <input
                                    id="idDocumentNumber"
                                    type="text"
                                    value={idDocumentNumber}
                                    onChange={(e) => setIdDocumentNumber(e.target.value)}
                                    placeholder="ABC123456"
                                />
                            </div>

                            <div>
                                <label htmlFor="emergencyContactName">Kontakt awaryjny — imię i nazwisko</label>
                                <input
                                    id="emergencyContactName"
                                    type="text"
                                    value={emergencyContactName}
                                    onChange={(e) => setEmergencyContactName(e.target.value)}
                                    placeholder="Anna Kowalska"
                                />
                            </div>

                            <div>
                                <label htmlFor="emergencyContactPhone">Kontakt awaryjny — telefon</label>
                                <input
                                    id="emergencyContactPhone"
                                    type="tel"
                                    value={emergencyContactPhone}
                                    onChange={(e) => setEmergencyContactPhone(e.target.value)}
                                    placeholder="+48 987 654 321"
                                />
                            </div>

                            <div>
                                <label htmlFor="status">Status</label>
                                <select
                                    id="status"
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                >
                                    <option value="active">Aktywny</option>
                                    <option value="past">Były</option>
                                    <option value="applicant">Kandydat</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="notes">Notatki</label>
                                <textarea
                                    id="notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={3}
                                    placeholder="Dodatkowe informacje..."
                                />
                            </div>

                            <button type="submit" disabled={submitState.loading}>
                                {submitState.loading ? 'Zapisywanie...' : isEdit ? 'Zapisz zmiany' : 'Dodaj najemcę'}
                            </button>
                        </form>
            }
        </div>
    );
};
