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
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { PROPERTY_STATUS_LABELS, PROPERTY_TYPE_LABELS, TENANT_STATUS_LABELS } from '@/constants/labels';

import detailStyles from './DetailPage.module.css';
import formStyles from './FormPage.module.css';

const STATUS_LABELS: Record<string, string> = {
    active: 'Aktywna',
    expired: 'Wygasła',
    terminated: 'Rozwiazana',
};

const styles = detailStyles;

interface LeaseSingleProps {
    id?: string;
}

export const LeaseSingle = ({ id }: LeaseSingleProps) => {
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

    // Lease query
    const leaseState = useAsync(async () => {
        const shouldFetch = !isNewMode && id;
        return shouldFetch
            ? database.from('lease_agreements').select('*, tenants(first_name, last_name, email, phone), properties(name, address)').eq('id', id).single().then(r => ({ data: r.data, error: r.error }))
            : { data: null, error: null };
    }, [id, refreshKey, isNewMode]);

    // Get transactions for this lease
    const transactionsState = useAsync(async () => {
        const shouldFetch = !isNewMode && id;
        return shouldFetch
            ? database.from('transactions').select('*').eq('lease_id', id).order('due_date', { ascending: false }).then(r => ({ data: r.data ?? [], error: r.error }))
            : { data: [], error: null };
    }, [id, refreshKey, isNewMode]);

    // Get full property details
    const propertyState = useAsync(async () => {
        const leaseData = leaseState.value?.data;
        const propertyId = leaseData?.property_id;
        const shouldFetch = !isNewMode && propertyId;
        return shouldFetch
            ? database.from('properties').select('*').eq('id', propertyId).single().then(r => ({ data: r.data, error: r.error }))
            : { data: null, error: null };
    }, [id, refreshKey, isNewMode, leaseState.value?.data?.property_id]);

    // Get full tenant details
    const tenantState = useAsync(async () => {
        const leaseData = leaseState.value?.data;
        const tenantId = leaseData?.tenant_id;
        const shouldFetch = !isNewMode && tenantId;
        return shouldFetch
            ? database.from('tenants').select('*').eq('id', tenantId).single().then(r => ({ data: r.data, error: r.error }))
            : { data: null, error: null };
    }, [id, refreshKey, isNewMode, leaseState.value?.data?.tenant_id]);

    // Attachments for this lease
    const attachmentsState = useAsync(async () => {
        const shouldFetch = !isNewMode && id;
        return shouldFetch
            ? database.from('attachments').select('*').eq('related_to_type', 'lease').eq('related_to_id', id).order('created_at', { ascending: false }).then(r => ({ data: r.data ?? [], error: r.error }))
            : { data: [], error: null };
    }, [id, refreshKey, isNewMode]);

    const lease = leaseState.value?.data;
    const property = propertyState.value?.data;
    const tenant = tenantState.value?.data;
    const transactions = transactionsState.value?.data ?? [];
    const attachments = attachmentsState.value?.data ?? [];

    // Separate income (rent) from expenses
    const billingItems = transactions.filter(t => t.type !== 'expense');
    const payments = transactions.filter(t => t.status === 'paid');

    // Calculate totals
    const totalBilling = billingItems.reduce((sum, item) => sum + (item.amount ?? 0), 0);
    const totalPaid = payments.reduce((sum, item) => sum + (item.amount ?? 0), 0);
    const totalBalance = totalBilling - totalPaid;

    const error = leaseState.error ?? leaseState.value?.error;

    // Render view mode
    const renderViewMode = () => (
        <div className={styles.page}>
            <Link href={routes.landlord.leases()} className={styles.backLink}>← Powrot do listy</Link>

            {error
                ? <ErrorBanner msg={error.message} retry={handleRefresh} />
                : leaseState.loading
                    ? <Spinner />
                    : !lease
                        ? <ErrorBanner msg="Nie znaleziono umowy" />
                        : <>
                            <div className={styles.header}>
                                <h1 className={styles.title}>Umowa najmu</h1>
                                <button onClick={navigateToEdit} className={styles.editButton}>
                                    Edytuj
                                </button>
                            </div>

                            <div className={styles.content}>
                                <div className={styles.mainContent}>
                                    <div className={styles.section}>
                                        <h2 className={styles.sectionTitle}>Szczegoly umowy</h2>
                                        <div className={styles.infoGrid}>
                                            <div className={styles.infoItem}>
                                                <span className={styles.infoLabel}>Nieruchomosc</span>
                                                <span className={styles.infoValue}>
                                                    <Link href={routes.landlord.properties({ id: lease.property_id })}>
                                                        {(lease as any).properties?.name ?? lease.property_id}
                                                    </Link>
                                                </span>
                                            </div>
                                            <div className={styles.infoItem}>
                                                <span className={styles.infoLabel}>Najemca</span>
                                                <span className={styles.infoValue}>
                                                    <Link href={routes.landlord.tenants({ id: lease.tenant_id })}>
                                                        {(lease as any).tenants
                                                            ? `${(lease as any).tenants.first_name} ${(lease as any).tenants.last_name}`
                                                            : lease.tenant_id}
                                                    </Link>
                                                </span>
                                            </div>
                                            <div className={styles.infoItem}>
                                                <span className={styles.infoLabel}>Status</span>
                                                <span className={`${styles.statusBadge} ${lease.status === 'active' ? styles.statusActive :
                                                    lease.status === 'expired' ? styles.statusExpired : styles.statusTerminated}`}>
                                                    {STATUS_LABELS[lease.status] ?? lease.status}
                                                </span>
                                            </div>
                                            <div className={styles.infoItem}>
                                                <span className={styles.infoLabel}>Okres</span>
                                                <span className={styles.infoValue}>
                                                    {lease.start_date} — {lease.end_date ?? 'Bezterminowa'}
                                                </span>
                                            </div>
                                            <div className={styles.infoItem}>
                                                <span className={styles.infoLabel}>Czynsz miesieczny</span>
                                                <span className={styles.infoValueAmount}>{formatCurrency(lease.monthly_rent)}</span>
                                            </div>
                                            <div className={styles.infoItem}>
                                                <span className={styles.infoLabel}>Kaucja</span>
                                                <span className={styles.infoValueAmount}>{formatCurrency(lease.deposit_amount)}</span>
                                            </div>
                                            {lease.notes && (
                                                <div className={styles.infoItem}>
                                                    <span className={styles.infoLabel}>Notatki</span>
                                                    <span className={styles.infoValue}>{lease.notes}</span>
                                                </div>
                                            )}
                                            <div className={styles.infoItem}>
                                                <span className={styles.infoLabel}>Utworzono</span>
                                                <span className={styles.infoValue}>
                                                    {lease.created_at ? formatDate(lease.created_at) : '—'}
                                                </span>
                                            </div>
                                            {lease.created_by && (
                                                <div className={styles.infoItem}>
                                                    <span className={styles.infoLabel}>Tworca</span>
                                                    <span className={styles.infoValue}>
                                                        {lease.created_by.substring(0, 8)}...
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {property && (
                                        <div className={styles.section}>
                                            <h2 className={styles.sectionTitle}>Szczegoly nieruchomosci</h2>
                                            <div className={styles.infoGrid}>
                                                <div className={styles.infoItem}>
                                                    <span className={styles.infoLabel}>Adres</span>
                                                    <span className={styles.infoValueAddress}>{property.address}</span>
                                                </div>
                                                <div className={styles.infoItem}>
                                                    <span className={styles.infoLabel}>Typ</span>
                                                    <span className={styles.infoValue}>
                                                        {PROPERTY_TYPE_LABELS[property.property_type ?? ''] ?? property.property_type}
                                                    </span>
                                                </div>
                                                <div className={styles.infoItem}>
                                                    <span className={styles.infoLabel}>Status</span>
                                                    <span className={`${styles.statusBadge} ${property.status === 'available' ? styles.statusAvailable :
                                                        property.status === 'occupied' ? styles.statusOccupied : styles.statusMaintenance}`}>
                                                        {PROPERTY_STATUS_LABELS[property.status ?? ''] ?? property.status}
                                                    </span>
                                                </div>
                                                <div className={styles.infoItem}>
                                                    <span className={styles.infoLabel}>Czynsz</span>
                                                    <span className={styles.infoValueAmount}>{formatCurrency(property.monthly_rent)}</span>
                                                </div>
                                                {property.size_sqm && (
                                                    <div className={styles.infoItem}>
                                                        <span className={styles.infoLabel}>Powierzchnia</span>
                                                        <span className={styles.infoValue}>{property.size_sqm} m2</span>
                                                    </div>
                                                )}
                                                {property.bedrooms && (
                                                    <div className={styles.infoItem}>
                                                        <span className={styles.infoLabel}>Sypialnie</span>
                                                        <span className={styles.infoValue}>{property.bedrooms}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {tenant && (
                                        <div className={styles.section}>
                                            <h2 className={styles.sectionTitle}>Dane najemcy</h2>
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
                                                        {TENANT_STATUS_LABELS[tenant.status] ?? tenant.status}
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
                                            </div>
                                        </div>
                                    )}

                                    <div className={styles.section}>
                                        <h2 className={styles.sectionTitle}>Rozliczenia ({billingItems.length})</h2>
                                        {transactionsState.loading
                                            ? <Spinner />
                                            : billingItems.length === 0
                                                ? <p>Brak rozliczen dla tej umowy</p>
                                                : <table className={styles.table}>
                                                    <thead>
                                                        <tr>
                                                            <th>Opis</th>
                                                            <th>Typ</th>
                                                            <th>Kwota</th>
                                                            <th>Termin</th>
                                                            <th>Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {billingItems.map(item => (
                                                            <tr key={item.id}>
                                                                <td>{item.description}</td>
                                                                <td>{item.type}</td>
                                                                <td>{formatCurrency(item.amount ?? 0)}</td>
                                                                <td>{item.due_date ? formatDate(item.due_date) : '—'}</td>
                                                                <td>{item.status === 'paid' ? 'Oplacone' : item.status === 'overdue' ? 'Przeterminowane' : 'Oczekujace'}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                        }
                                    </div>

                                    {payments.length > 0 && (
                                        <div className={styles.section}>
                                            <h2 className={styles.sectionTitle}>Ostatnie platnosci</h2>
                                            <table className={styles.table}>
                                                <thead>
                                                    <tr>
                                                        <th>Data</th>
                                                        <th>Kwota</th>
                                                        <th>Opis</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {payments.map(payment => (
                                                        <tr key={payment.id}>
                                                            <td>{formatDate(payment.due_date)}</td>
                                                            <td>{formatCurrency(payment.amount)}</td>
                                                            <td>{payment.description ?? '—'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                <div className={styles.sidebar}>
                                    <div className={styles.leaseInfo}>
                                        <h3 className={styles.leaseInfoTitle}>Podsumowanie</h3>
                                        <div className={styles.leaseInfoItem}>
                                            <span className={styles.leaseInfoLabel}>Czynsz miesieczny</span>
                                            <span className={styles.leaseInfoValueAmount}>{formatCurrency(lease.monthly_rent)}</span>
                                        </div>
                                        <div className={styles.leaseInfoItem}>
                                            <span className={styles.leaseInfoLabel}>Kaucja</span>
                                            <span className={styles.leaseInfoValueAmount}>{formatCurrency(lease.deposit_amount)}</span>
                                        </div>
                                        <div className={styles.leaseInfoItem}>
                                            <span className={styles.leaseInfoLabel}>Status</span>
                                            <span className={styles.leaseInfoValue}>{STATUS_LABELS[lease.status] ?? lease.status}</span>
                                        </div>
                                        <div className={styles.leaseInfoItem}>
                                            <span className={styles.leaseInfoLabel}>Okres</span>
                                            <span className={styles.leaseInfoValue}>
                                                {lease.start_date} — {lease.end_date ?? 'Bezterminowa'}
                                            </span>
                                        </div>
                                        <div className={styles.leaseInfoItem}>
                                            <span className={styles.leaseInfoLabel}>Saldo</span>
                                            <span className={totalBalance > 0 ? styles.negative : styles.positive}>
                                                {formatCurrency(totalBalance)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
            }
        </div>
    );

    // Render edit mode
    const renderEditMode = () => {
        const [tenantId, setTenantId] = useState('');
        const [propertyId, setPropertyId] = useState('');
        const [startDate, setStartDate] = useState('');
        const [endDate, setEndDate] = useState('');
        const [monthlyRent, setMonthlyRent] = useState('');
        const [depositAmount, setDepositAmount] = useState('');
        const [status, setStatus] = useState('active');
        const [notes, setNotes] = useState('');

        const tenantsState = useAsync(async () => {
            return database.from('tenants').select('id, first_name, last_name').eq('status', 'active').order('last_name').then(r => ({ data: r.data ?? [], error: r.error }));
        }, []);

        const propertiesState = useAsync(async () => {
            return database.from('properties').select('id, name, address, status').order('name').then(r => ({ data: r.data ?? [], error: r.error }));
        }, []);

        useEffect(() => {
            lease && (
                setTenantId(lease.tenant_id),
                setPropertyId(lease.property_id),
                setStartDate(lease.start_date),
                setEndDate(lease.end_date ?? ''),
                setMonthlyRent(lease.monthly_rent.toString()),
                setDepositAmount(lease.deposit_amount.toString()),
                setStatus(lease.status),
                setNotes(lease.notes ?? '')
            );
        }, [lease]);

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

            const { error } = isNewMode
                ? await database.from('lease_agreements').insert(payload)
                : await database.from('lease_agreements').update(payload).eq('id', id!);

            !error && (handleRefresh(), navigateToDetail());
            return { error };
        }, [tenantId, propertyId, startDate, endDate, monthlyRent, depositAmount, status, notes, id, isNewMode]);

        const tenants = tenantsState.value?.data ?? [];
        const properties = propertiesState.value?.data ?? [];
        const isDataLoading = tenantsState.loading || propertiesState.loading;

        return (
            <div className={formStyles.page}>
                <button onClick={navigateToDetail} className={formStyles.backLink}>← Powrot do szczegolow</button>

                <h1 className={formStyles.title}>{isNewMode ? 'Nowa umowa najmu' : 'Edytuj umowe najmu'}</h1>

                {isDataLoading
                    ? <Spinner />
                    : <form className={formStyles.form} onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                        {(submitState.error || submitState.value?.error) && (
                            <div>
                                {submitState.error && <ErrorBanner msg={submitState.error.message} />}
                                {submitState.value?.error && <ErrorBanner msg={submitState.value.error.message} />}
                            </div>
                        )}

                        <div className={formStyles.formField}>
                            <label htmlFor="tenantId">Najemca</label>
                            <select
                                id="tenantId"
                                value={tenantId}
                                onChange={(e) => setTenantId(e.target.value)}
                                required
                            >
                                <option value="">— Wybierz najemce —</option>
                                {tenants.map(t => (
                                    <option key={t.id} value={t.id}>
                                        {t.first_name} {t.last_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={formStyles.formField}>
                            <label htmlFor="propertyId">Nieruchomosc</label>
                            <select
                                id="propertyId"
                                value={propertyId}
                                onChange={(e) => setPropertyId(e.target.value)}
                                required
                            >
                                <option value="">— Wybierz nieruchomosc —</option>
                                {properties.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} ({p.address}) [{p.status}]
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={formStyles.formField}>
                            <label htmlFor="startDate">Data rozpoczecia</label>
                            <input
                                id="startDate"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                required
                            />
                        </div>

                        <div className={formStyles.formField}>
                            <label htmlFor="endDate">Data zakonczenia (opcjonalna)</label>
                            <input
                                id="endDate"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>

                        <div className={formStyles.formField}>
                            <label htmlFor="monthlyRent">Czynsz miesieczny (PLN)</label>
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

                        <div className={formStyles.formField}>
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

                        <div className={formStyles.formField}>
                            <label htmlFor="status">Status</label>
                            <select
                                id="status"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                            >
                                <option value="active">Aktywna</option>
                                <option value="expired">Wygasla</option>
                                <option value="terminated">Rozwiazana</option>
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
                            {submitState.loading ? 'Zapisywanie...' : isNewMode ? 'Dodaj umowe' : 'Zapisz zmiany'}
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
