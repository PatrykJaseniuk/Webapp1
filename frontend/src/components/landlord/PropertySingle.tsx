'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAsync, useAsyncFn } from 'react-use';

import { routes } from '@/routes';
import { database } from '@/api/database';
import { Spinner } from '@/components/shared/Spinner';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { PROPERTY_STATUS_LABELS, PROPERTY_TYPE_LABELS, LEASE_STATUS_LABELS } from '@/constants/labels';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';

import { AttachmentsGrid } from './lists/AttachmentsGrid';

import detailStyles from './DetailPage.module.css';
import formStyles from './FormPage.module.css';

const styles = detailStyles;

interface PropertySingleProps {
    id?: string;
}

export const PropertySingle = ({ id }: PropertySingleProps) => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const action = searchParams.get('action') || 'detail';
    const isEditMode = action === 'edit';
    const isNewMode = action === 'new';

    // Refresh key to trigger data reload
    const [refreshKey, setRefreshKey] = useState(0);
    const handleRefresh = () => setRefreshKey(prev => prev + 1);

    // Navigation handlers
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

    // Property query - only runs when not new mode and id exists
    const propertyState = useAsync(async () => {
        const shouldFetch = !isNewMode && id;
        return shouldFetch
            ? database.from('properties').select('*').eq('id', id).single().then(r => ({ data: r.data, error: r.error }))
            : { data: null, error: null };
    }, [id, refreshKey, isNewMode]);

    // Current lease info from property_occupancy view
    const occupancyState = useAsync(async () => {
        const shouldFetch = !isNewMode && id;
        return shouldFetch
            ? database.from('property_occupancy').select('*').eq('id', id).single().then(r => ({ data: r.data, error: r.error }))
            : { data: null, error: null };
    }, [id, refreshKey, isNewMode]);

    // Get transactions for this property
    const transactionsState = useAsync(async () => {
        const shouldFetch = !isNewMode && id;
        return shouldFetch
            ? database.from('transactions').select('*').eq('property_id', id).order('due_date', { ascending: false }).then(r => ({ data: r.data ?? [], error: r.error }))
            : { data: [], error: null };
    }, [id, refreshKey, isNewMode]);

    // Attachments
    const attachmentsState = useAsync(async () => {
        const shouldFetch = !isNewMode && id;
        return shouldFetch
            ? database.from('attachments').select('*').eq('related_to_type', 'property').eq('related_to_id', id).order('created_at', { ascending: false }).then(r => ({ data: r.data ?? [], error: r.error }))
            : { data: [], error: null };
    }, [id, refreshKey, isNewMode]);

    // Get all lease agreements for this property
    const allLeasesState = useAsync(async () => {
        const shouldFetch = !isNewMode && id;
        return shouldFetch
            ? database.from('lease_agreements').select('*, tenants(first_name, last_name, email, phone)').eq('property_id', id).order('start_date', { ascending: false }).then(r => ({ data: r.data ?? [], error: r.error }))
            : { data: [], error: null };
    }, [id, refreshKey, isNewMode]);

    // Extract data from states
    const property = propertyState.value?.data;
    const occupancy = occupancyState.value?.data;
    const transactions = transactionsState.value?.data ?? [];
    const attachments = attachmentsState.value?.data ?? [];
    const allLeases = allLeasesState.value?.data ?? [];

    // Get unique tenants from all leases
    const historicalTenants = useMemo(() => {
        const seenTenantIds = new Set();
        return allLeases.reduce((acc: any[], lease: any) => {
            const tenantId = lease.tenant_id;
            return seenTenantIds.has(tenantId) ? acc : (seenTenantIds.add(tenantId), [...acc, {
                id: tenantId,
                name: lease.tenants ? `${lease.tenants.first_name} ${lease.tenants.last_name}` : 'Nieznany',
                email: lease.tenants?.email,
                phone: lease.tenants?.phone,
                leaseStatus: lease.status,
                leaseStart: lease.start_date,
                leaseEnd: lease.end_date
            }]);
        }, []);
    }, [allLeases]);

    // Separate transactions by type
    const billingItems = transactions.filter((t: any) => t.type !== 'expense');
    const paidTransactions = billingItems.filter((t: any) => t.status === 'paid');

    // Calculate financial summary
    const totalBilling = billingItems.reduce((sum: number, item: any) => sum + (item.amount ?? 0), 0);
    const totalPaid = paidTransactions.reduce((sum: number, item: any) => sum + (item.amount ?? 0), 0);
    const totalBalance = totalBilling - totalPaid;
    const totalExpenses = transactions.filter((t: any) => t.type === 'expense').reduce((sum: number, exp: any) => sum + (exp.amount ?? 0), 0);
    const netProfit = totalPaid - totalExpenses;

    const error = propertyState.error ?? propertyState.value?.error;

    // Attachment click handler
    const handleAttachmentClick = (attachmentId: string) => {
        const attachment = attachments.find(a => a.id === attachmentId);
        attachment && window.open(attachment.file_url, '_blank');
    };

    // === Form state for edit mode - always defined at top level ===
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [propertyType, setPropertyType] = useState('apartment');
    const [sizeSqm, setSizeSqm] = useState('');
    const [bedrooms, setBedrooms] = useState('');
    const [monthlyRent, setMonthlyRent] = useState('');
    const [depositAmount, setDepositAmount] = useState('');
    const [status, setStatus] = useState('available');
    const [notes, setNotes] = useState('');

    // Load existing data when property loads
    useEffect(() => {
        property && (
            setName(property.name || ''),
            setAddress(property.address || ''),
            setPropertyType(property.property_type || 'apartment'),
            setSizeSqm(property.size_sqm?.toString() ?? ''),
            setBedrooms(property.bedrooms?.toString() ?? ''),
            setMonthlyRent(property.monthly_rent?.toString() ?? ''),
            setDepositAmount(property.deposit_amount?.toString() ?? ''),
            setStatus(property.status || 'available'),
            setNotes(property.notes ?? '')
        );
    }, [property]);

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

        const { error } = isNewMode
            ? await database.from('properties').insert(payload)
            : await database.from('properties').update(payload).eq('id', id!);

        !error && (handleRefresh(), navigateToDetail());
        return { error };
    }, [name, address, propertyType, sizeSqm, bedrooms, monthlyRent, depositAmount, status, notes, id, isNewMode]);

    // === Main render ===
    return isEditMode || isNewMode ? (
        // EDIT/NEW MODE
        <div className={formStyles.page}>
            <button onClick={navigateToDetail} className={formStyles.backLink}>← Powrot do szczegolow</button>

            <h1 className={formStyles.title}>{isNewMode ? 'Nowa nieruchomosc' : 'Edytuj nieruchomosc'}</h1>

            {propertyState.loading
                ? <Spinner />
                : <form className={formStyles.form} onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                    {(submitState.error || submitState.value?.error) && (
                        <div>
                            {submitState.error && <ErrorBanner msg={submitState.error.message} />}
                            {submitState.value?.error && <ErrorBanner msg={submitState.value.error.message} />}
                        </div>
                    )}

                    <div className={formStyles.formField}>
                        <label htmlFor="name">Nazwa</label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder="np. Mieszkanie przy Marszalkowskich"
                        />
                    </div>

                    <div className={formStyles.formField}>
                        <label htmlFor="address">Adres</label>
                        <input
                            id="address"
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            required
                            placeholder="ul. Marszalkowska 10/5, Warszawa"
                        />
                    </div>

                    <div className={formStyles.formField}>
                        <label htmlFor="propertyType">Typ nieruchomosci</label>
                        <select
                            id="propertyType"
                            value={propertyType}
                            onChange={(e) => setPropertyType(e.target.value)}
                        >
                            <option value="apartment">Mieszkanie</option>
                            <option value="house">Dom</option>
                            <option value="commercial">Lokal uzytkowy</option>
                            <option value="room">Pokoj</option>
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
                        <div className={formStyles.formField}>
                            <label htmlFor="sizeSqm">Powierzchnia (m2)</label>
                            <input
                                id="sizeSqm"
                                type="number"
                                step="0.01"
                                value={sizeSqm}
                                onChange={(e) => setSizeSqm(e.target.value)}
                                placeholder="np. 55.5"
                            />
                        </div>

                        <div className={formStyles.formField}>
                            <label htmlFor="bedrooms">Liczba sypialni</label>
                            <input
                                id="bedrooms"
                                type="number"
                                value={bedrooms}
                                onChange={(e) => setBedrooms(e.target.value)}
                                placeholder="np. 2"
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
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
                    </div>

                    <div className={formStyles.formField}>
                        <label htmlFor="status">Status</label>
                        <select
                            id="status"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <option value="available">Wolna</option>
                            <option value="occupied">Zajeta</option>
                            <option value="inactive">Nieaktywna</option>
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
                        {submitState.loading ? 'Zapisywanie...' : isNewMode ? 'Dodaj nieruchomosc' : 'Zapisz zmiany'}
                    </button>
                </form>
            }
        </div>
    ) : (
        // VIEW MODE
        <div className={styles.page}>
            <Link href={routes.landlord.properties()} className={styles.backLink}>← Powrot do listy</Link>

            {error
                ? <ErrorBanner msg={error.message} retry={handleRefresh} />
                : propertyState.loading
                    ? <Spinner />
                    : !property
                        ? <ErrorBanner msg="Nie znaleziono nieruchomosci" />
                        : <>
                            <div className={styles.header}>
                                <h1 className={styles.title}>{property.name}</h1>
                                <button onClick={navigateToEdit} className={styles.editButton}>
                                    Edytuj
                                </button>
                            </div>

                            <div className={styles.content}>
                                <div className={styles.mainContent}>
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
                                                <span className={styles.infoLabel}>Czynsz miesieczny</span>
                                                <span className={styles.infoValueAmount}>{formatCurrency(property.monthly_rent ?? 0)}</span>
                                            </div>
                                            <div className={styles.infoItem}>
                                                <span className={styles.infoLabel}>Kaucja</span>
                                                <span className={styles.infoValueAmount}>{formatCurrency(property.deposit_amount ?? 0)}</span>
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
                                            {property.notes && (
                                                <div className={styles.infoItem}>
                                                    <span className={styles.infoLabel}>Notatki</span>
                                                    <span className={styles.infoValue}>{property.notes}</span>
                                                </div>
                                            )}
                                            <div className={styles.infoItem}>
                                                <span className={styles.infoLabel}>Dodano</span>
                                                <span className={styles.infoValue}>
                                                    {property.created_at ? formatDate(property.created_at) : '—'}
                                                </span>
                                            </div>
                                            {property.created_by && (
                                                <div className={styles.infoItem}>
                                                    <span className={styles.infoLabel}>Tworca</span>
                                                    <span className={styles.infoValue}>
                                                        {property.created_by.substring(0, 8)}...
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {occupancy?.current_lease_id && (
                                        <div className={styles.section}>
                                            <h2 className={styles.sectionTitle}>Aktualna umowa</h2>
                                            <div className={styles.infoGrid}>
                                                <div className={styles.infoItem}>
                                                    <span className={styles.infoLabel}>Najemca</span>
                                                    <span className={styles.infoValue}>
                                                        <Link href={routes.landlord.tenants({ id: occupancy.tenant_id ?? undefined })}>
                                                            {occupancy.current_tenant_name}
                                                        </Link>
                                                    </span>
                                                </div>
                                                <div className={styles.infoItem}>
                                                    <span className={styles.infoLabel}>Czynsz</span>
                                                    <span className={styles.infoValueAmount}>{formatCurrency(occupancy.current_rent ?? 0)}</span>
                                                </div>
                                                <div className={styles.infoItem}>
                                                    <span className={styles.infoLabel}>Okres</span>
                                                    <span className={styles.infoValue}>
                                                        {occupancy.lease_start} — {occupancy.lease_end ?? 'Bezterminowa'}
                                                    </span>
                                                </div>
                                            </div>
                                            <Link href={routes.landlord.leases({ id: occupancy.current_lease_id })} className={styles.editButton}>
                                                Szczegoly umowy →
                                            </Link>
                                        </div>
                                    )}

                                    {allLeases.length > 0 && (
                                        <div className={styles.section}>
                                            <h2 className={styles.sectionTitle}>Wszystkie umowy ({allLeases.length})</h2>
                                            <table className={styles.table}>
                                                <thead>
                                                    <tr>
                                                        <th>Najemca</th>
                                                        <th>Okres</th>
                                                        <th>Czynsz</th>
                                                        <th>Kaucja</th>
                                                        <th>Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {allLeases.map((lease: any) => (
                                                        <tr key={lease.id}>
                                                            <td>
                                                                <Link href={routes.landlord.tenants({ id: lease.tenant_id })}>
                                                                    {lease.tenants ? `${lease.tenants.first_name} ${lease.tenants.last_name}` : lease.tenant_id}
                                                                </Link>
                                                            </td>
                                                            <td>{lease.start_date} — {lease.end_date ?? 'Bezterminowa'}</td>
                                                            <td>{formatCurrency(lease.monthly_rent)}</td>
                                                            <td>{formatCurrency(lease.deposit_amount)}</td>
                                                            <td>{LEASE_STATUS_LABELS[lease.status] ?? lease.status}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}

                                    <AttachmentsGrid data={attachments} onRowClick={handleAttachmentClick} />
                                </div>

                                <div className={styles.sidebar}>
                                    <div className={styles.summaryCard}>
                                        <h3 className={styles.summaryTitle}>Podsumowanie finansowe</h3>
                                        <div className={styles.summaryRow}>
                                            <span>Suma rozliczen</span>
                                            <span>{formatCurrency(totalBilling)}</span>
                                        </div>
                                        <div className={styles.summaryRow}>
                                            <span>Opłacono</span>
                                            <span className={styles.positive}>{formatCurrency(totalPaid)}</span>
                                        </div>
                                        <div className={styles.summaryRow}>
                                            <span>Saldo</span>
                                            <span className={totalBalance > 0 ? styles.negative : styles.positive}>
                                                {formatCurrency(totalBalance)}
                                            </span>
                                        </div>
                                        <div className={styles.summaryDivider} />
                                        <div className={styles.summaryRow}>
                                            <span>Wydatki</span>
                                            <span className={styles.negative}>{formatCurrency(totalExpenses)}</span>
                                        </div>
                                        <div className={styles.summaryRow}>
                                            <span>Zysk netto</span>
                                            <span className={netProfit >= 0 ? styles.positive : styles.negative}>
                                                {formatCurrency(netProfit)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
            }
        </div>
    );
};
