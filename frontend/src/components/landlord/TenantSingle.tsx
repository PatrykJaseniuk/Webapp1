'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAsync, useAsyncFn } from 'react-use';

import { routes } from '@/routes';
import { database } from '@/api/database';
import { Spinner } from '@/components/shared/Spinner';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { EmptyState } from '@/components/shared/EmptyState';
import { AttachmentsGrid } from './lists/AttachmentsGrid';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';

import detailStyles from './DetailPage.module.css';
import formStyles from './FormPage.module.css';

const STATUS_LABELS: Record<string, string> = {
    active: 'Aktywny',
    past: 'Były',
    applicant: 'Kandydat',
};

const styles = detailStyles;

interface TenantSingleProps {
    id?: string;
}

export const TenantSingle = ({ id }: TenantSingleProps) => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const action = searchParams.get('action') || 'detail';
    const isEditMode = action === 'edit';
    const isNewMode = action === 'new';

    const [refreshKey, setRefreshKey] = useState(0);
    const handleRefresh = () => setRefreshKey(prev => prev + 1);

    const navigateToEdit = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('action', 'edit');
        router.push(`?${params.toString()}`);
    };

    const navigateToDetail = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('action', 'detail');
        router.push(`?${params.toString()}`);
    };

    // Tenant query
    const tenantState = useAsync(async () => {
        const shouldFetch = !isNewMode && id;
        return shouldFetch
            ? database.from('tenants').select('*').eq('id', id).single().then(r => ({ data: r.data, error: r.error }))
            : { data: null, error: null };
    }, [id, refreshKey, isNewMode]);

    // Leases query
    const leasesState = useAsync(async () => {
        const shouldFetch = !isNewMode && id;
        return shouldFetch
            ? database.from('lease_agreements').select('*, properties(name, address)').eq('tenant_id', id).order('start_date', { ascending: false }).then(r => ({ data: r.data ?? [], error: r.error }))
            : { data: [], error: null };
    }, [id, refreshKey, isNewMode]);

    // Attachments
    const attachmentsState = useAsync(async () => {
        const shouldFetch = !isNewMode && id;
        return shouldFetch
            ? database.from('attachments').select('*').eq('related_to_type', 'tenant').eq('related_to_id', id).order('created_at', { ascending: false }).then(r => ({ data: r.data ?? [], error: r.error }))
            : { data: [], error: null };
    }, [id, refreshKey, isNewMode]);

    // All transactions for all tenant's leases
    const allTransactionsState = useAsync(async () => {
        const shouldFetch = !isNewMode && id;
        if (!shouldFetch) return { data: [], error: null };

        const { data: leases } = await database.from('lease_agreements').select('id, property_id').eq('tenant_id', id);
        const leaseIds = (leases ?? []).map(l => l.id);

        return leaseIds.length > 0
            ? database.from('transactions').select('*').in('lease_id', leaseIds).order('due_date', { ascending: false }).then(r => ({ data: r.data ?? [], error: r.error }))
            : { data: [], error: null };
    }, [id, refreshKey, isNewMode]);

    const tenant = tenantState.value?.data;
    const leases = leasesState.value?.data ?? [];
    const attachments = attachmentsState.value?.data ?? [];
    const allTransactions = allTransactionsState.value?.data ?? [];
    const recentTransactions = allTransactions.slice(0, 10);

    const error = tenantState.error ?? tenantState.value?.error;

    // Render view mode
    const renderViewMode = () => (
        <div className={styles.page}>
            <Link href={routes.landlord.tenants()} className={styles.backLink}>← Powrot do listy</Link>

            {error
                ? <ErrorBanner msg={error.message} retry={handleRefresh} />
                : tenantState.loading
                    ? <Spinner />
                    : !tenant
                        ? <ErrorBanner msg="Nie znaleziono najemcy" />
                        : <>
                            <div className={styles.header}>
                                <h1 className={styles.title}>{tenant.first_name} {tenant.last_name}</h1>
                                <button onClick={navigateToEdit} className={styles.editButton}>
                                    Edytuj
                                </button>
                            </div>

                            <div className={styles.content}>
                                <div className={styles.mainContent}>
                                    <div className={styles.section}>
                                        <h2 className={styles.sectionTitle}>Dane kontaktowe</h2>
                                        <div className={styles.infoGrid}>
                                            <div className={styles.infoItem}>
                                                <span className={styles.infoLabel}>Email</span>
                                                <span className={styles.infoValueEmail}>{tenant.email}</span>
                                            </div>
                                            <div className={styles.infoItem}>
                                                <span className={styles.infoLabel}>Telefon</span>
                                                <span className={styles.infoValuePhone}>{tenant.phone}</span>
                                            </div>
                                            <div className={styles.infoItem}>
                                                <span className={styles.infoLabel}>Status</span>
                                                <span className={`${styles.statusBadge} ${tenant.status === 'active' ? styles.statusActive :
                                                    tenant.status === 'past' ? styles.statusPast : styles.statusApplicant}`}>
                                                    {STATUS_LABELS[tenant.status] ?? tenant.status}
                                                </span>
                                            </div>
                                            {tenant.id_document_number && (
                                                <div className={styles.infoItem}>
                                                    <span className={styles.infoLabel}>Nr dokumentu</span>
                                                    <span className={styles.infoValue}>{tenant.id_document_number}</span>
                                                </div>
                                            )}
                                            {tenant.emergency_contact_name && (
                                                <div className={styles.infoItem}>
                                                    <span className={styles.infoLabel}>Kontakt awaryjny</span>
                                                    <span className={styles.infoValue}>
                                                        {tenant.emergency_contact_name} — {tenant.emergency_contact_phone}
                                                    </span>
                                                </div>
                                            )}
                                            {tenant.notes && (
                                                <div className={styles.infoItem}>
                                                    <span className={styles.infoLabel}>Notatki</span>
                                                    <span className={styles.infoValue}>{tenant.notes}</span>
                                                </div>
                                            )}
                                            <div className={styles.infoItem}>
                                                <span className={styles.infoLabel}>Dodano</span>
                                                <span className={styles.infoValue}>
                                                    {tenant.created_at ? formatDate(tenant.created_at) : '—'}
                                                </span>
                                            </div>
                                            {tenant.user_id && (
                                                <div className={styles.infoItem}>
                                                    <span className={styles.infoLabel}>Konto uzytkownika</span>
                                                    <span className={styles.infoValue}>
                                                        {tenant.user_id.substring(0, 8)}...
                                                    </span>
                                                </div>
                                            )}
                                            {!tenant.user_id && (
                                                <div className={styles.infoItem}>
                                                    <span className={styles.infoLabel}>Konto uzytkownika</span>
                                                    <span className={styles.infoValue}>
                                                        Nie polaczone
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className={styles.section}>
                                        <h2 className={styles.sectionTitle}>Umowy najmu ({leases.length})</h2>
                                        {leasesState.loading
                                            ? <Spinner />
                                            : leases.length === 0
                                                ? <EmptyState message="Brak umow najmu dla tego najemcy" />
                                                : <table className={styles.table}>
                                                    <thead>
                                                        <tr>
                                                            <th>Nieruchomosc</th>
                                                            <th>Okres</th>
                                                            <th>Czynsz</th>
                                                            <th>Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {leases.map(lease => (
                                                            <tr key={lease.id}>
                                                                <td>
                                                                    <Link href={routes.landlord.properties({ id: lease.property_id })}>
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
                                        }
                                    </div>
                                    {recentTransactions.length > 0 && (
                                        <div className={styles.section}>
                                            <h2 className={styles.sectionTitle}>Ostatnie transakcje</h2>
                                            <table className={styles.table}>
                                                <thead>
                                                    <tr>
                                                        <th>Data</th>
                                                        <th>Typ</th>
                                                        <th>Opis</th>
                                                        <th>Kwota</th>
                                                        <th>Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {recentTransactions.map((item: any) => (
                                                        <tr key={item.id}>
                                                            <td>{item.due_date ? formatDate(item.due_date) : '—'}</td>
                                                            <td>{item.type}</td>
                                                            <td>{item.description}</td>
                                                            <td className={Number(item.amount) >= 0 ? styles.positive : styles.negative}>
                                                                {formatCurrency(Number(item.amount))}
                                                            </td>
                                                            <td>{item.status}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                    <AttachmentsGrid data={attachments} onRowClick={(attachmentId: string) => {
                                        const attachment = attachments.find(a => a.id === attachmentId);
                                        attachment && window.open(attachment.file_url, '_blank');
                                    }} />
                                    {allTransactions.length > 0 && (
                                        <div className={styles.section}>
                                            <h2 className={styles.sectionTitle}>Wszystkie transakcje ({allTransactions.length})</h2>
                                            <table className={styles.table}>
                                                <thead>
                                                    <tr>
                                                        <th>Data</th>
                                                        <th>Typ</th>
                                                        <th>Opis</th>
                                                        <th>Kwota</th>
                                                        <th>Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {allTransactions.map((transaction: any) => (
                                                        <tr key={transaction.id}>
                                                            <td>{transaction.due_date ? formatDate(transaction.due_date) : '—'}</td>
                                                            <td>{transaction.type}</td>
                                                            <td>{transaction.description}</td>
                                                            <td className={Number(transaction.amount) >= 0 ? styles.positive : styles.negative}>
                                                                {formatCurrency(Number(transaction.amount))}
                                                            </td>
                                                            <td>{transaction.status}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                                <div className={styles.sidebar}>
                                    <div className={styles.leasesSection}>
                                        <h3 className={styles.leasesTitle}>Aktywne umowy</h3>
                                        {leasesState.loading
                                            ? <Spinner />
                                            : leases.filter(l => l.status === 'active').length === 0
                                                ? <div className={styles.noLeases}>Brak aktywnych umow</div>
                                                : leases.filter(l => l.status === 'active').map(lease => (
                                                    <div key={lease.id} className={styles.leaseItem}>
                                                        <div className={styles.leaseProperty}>
                                                            {(lease as any).properties?.name ?? lease.property_id}
                                                        </div>
                                                        <div className={styles.leaseDates}>
                                                            {lease.start_date} — {lease.end_date ?? 'Bezterminowa'}
                                                        </div>
                                                    </div>
                                                ))
                                        }
                                    </div>
                                </div>
                            </div>
                        </>
            }
        </div>
    );

    // Render edit mode
    const renderEditMode = () => {
        const [firstName, setFirstName] = useState('');
        const [lastName, setLastName] = useState('');
        const [email, setEmail] = useState('');
        const [phone, setPhone] = useState('');
        const [idDocumentNumber, setIdDocumentNumber] = useState('');
        const [emergencyContactName, setEmergencyContactName] = useState('');
        const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
        const [notes, setNotes] = useState('');
        const [status, setStatus] = useState('active');

        useEffect(() => {
            tenant && (
                setFirstName(tenant.first_name),
                setLastName(tenant.last_name),
                setEmail(tenant.email),
                setPhone(tenant.phone),
                setIdDocumentNumber(tenant.id_document_number ?? ''),
                setEmergencyContactName(tenant.emergency_contact_name ?? ''),
                setEmergencyContactPhone(tenant.emergency_contact_phone ?? ''),
                setNotes(tenant.notes ?? ''),
                setStatus(tenant.status)
            );
        }, [tenant]);

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

            const { error } = isNewMode
                ? await database.from('tenants').insert(payload)
                : await database.from('tenants').update(payload).eq('id', id!);

            !error && (handleRefresh(), navigateToDetail());
            return { error };
        }, [firstName, lastName, email, phone, idDocumentNumber, emergencyContactName, emergencyContactPhone, notes, status, id, isNewMode]);

        return (
            <div className={formStyles.page}>
                <button onClick={navigateToDetail} className={formStyles.backLink}>← Powrot do szczegolow</button>

                <h1 className={formStyles.title}>{isNewMode ? 'Nowy najemca' : 'Edytuj najemce'}</h1>

                {tenantState.loading
                    ? <Spinner />
                    : <form className={formStyles.form} onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                        {(submitState.error || submitState.value?.error) && (
                            <div>
                                {submitState.error && <ErrorBanner msg={submitState.error.message} />}
                                {submitState.value?.error && <ErrorBanner msg={submitState.value.error.message} />}
                            </div>
                        )}

                        <div className={formStyles.formField}>
                            <label htmlFor="firstName">Imie</label>
                            <input
                                id="firstName"
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                                placeholder="Jan"
                            />
                        </div>

                        <div className={formStyles.formField}>
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

                        <div className={formStyles.formField}>
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

                        <div className={formStyles.formField}>
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

                        <div className={formStyles.formField}>
                            <label htmlFor="idDocumentNumber">Nr dokumentu tozsamosci</label>
                            <input
                                id="idDocumentNumber"
                                type="text"
                                value={idDocumentNumber}
                                onChange={(e) => setIdDocumentNumber(e.target.value)}
                                placeholder="ABC123456"
                            />
                        </div>

                        <div className={formStyles.formField}>
                            <label htmlFor="emergencyContactName">Kontakt awaryjny — imie i nazwisko</label>
                            <input
                                id="emergencyContactName"
                                type="text"
                                value={emergencyContactName}
                                onChange={(e) => setEmergencyContactName(e.target.value)}
                                placeholder="Anna Kowalska"
                            />
                        </div>

                        <div className={formStyles.formField}>
                            <label htmlFor="emergencyContactPhone">Kontakt awaryjny — telefon</label>
                            <input
                                id="emergencyContactPhone"
                                type="tel"
                                value={emergencyContactPhone}
                                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                                placeholder="+48 987 654 321"
                            />
                        </div>

                        <div className={formStyles.formField}>
                            <label htmlFor="status">Status</label>
                            <select
                                id="status"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                            >
                                <option value="active">Aktywny</option>
                                <option value="past">Byly</option>
                                <option value="applicant">Kandydat</option>
                            </select>
                        </div>

                        <div className={formStyles.formField}>
                            <label htmlFor="notes">Notatki</label>
                            <textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Dodatkowe informacje..."
                            />
                        </div>

                        <button type="submit" className={formStyles.submitButton} disabled={submitState.loading}>
                            {submitState.loading ? 'Zapisywanie...' : isNewMode ? 'Dodaj najemce' : 'Zapisz zmiany'}
                        </button>
                    </form>
                }
            </div>
        );
    };

    return isEditMode || isNewMode
        ? renderEditMode()
        : renderViewMode();
};
