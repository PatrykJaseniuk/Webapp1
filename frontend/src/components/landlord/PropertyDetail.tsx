'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAsync } from 'react-use';

import { database } from '@/api/database';
import { Spinner } from '@/components/shared/Spinner';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { PROPERTY_STATUS_LABELS, PROPERTY_TYPE_LABELS } from '@/constants/labels';
import { routes } from '@/routes';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';

import { MetersTable } from './tables/MetersTable';
import { LeasesTable } from './tables/LeasesTable';
import { BillingTable } from './tables/BillingTable';
import { PaymentsTable } from './tables/PaymentsTable';
import { ExpensesTable } from './tables/ExpensesTable';
import { AttachmentsGrid } from './tables/AttachmentsGrid';

import styles from './DetailPage.module.css';

interface PropertyDetailProps {
    id: string;
}

export const PropertyDetail = ({ id }: PropertyDetailProps) => {
    const router = useRouter();
    const [refreshKey, setRefreshKey] = useState(0);

    const handleRefresh = () => setRefreshKey(prev => prev + 1);

    // Optimized query with nested selects for directly related tables
    const propertyState = useAsync(async () => {
        const { data, error } = await database
            .from('properties')
            .select(`
                *,
                meters(*),
                lease_agreements(
                    *,
                    tenants(
                        first_name,
                        last_name,
                        email,
                        phone
                    ),
                    billing_items(
                        *,
                        payments(*)
                    )
                ),
                property_expenses(*)
            `)
            .eq('id', id)
            .single();
        return { data, error };
    }, [id, refreshKey]);

    // Current lease info from property_occupancy view
    const occupancyState = useAsync(async () => {
        const { data, error } = await database
            .from('property_occupancy')
            .select('*')
            .eq('id', id)
            .single();
        return { data, error };
    }, [id, refreshKey]);

    // Attachments - separate query due to polymorphic relationship
    const attachmentsState = useAsync(async () => {
        const { data, error } = await database
            .from('attachments')
            .select('*')
            .eq('related_to_type', 'property')
            .eq('related_to_id', id)
            .order('created_at', { ascending: false });
        return { data, error };
    }, [id, refreshKey]);

    // Extract data from states
    const property = propertyState.value?.data;
    const occupancy = occupancyState.value?.data;
    const attachments = attachmentsState.value?.data ?? [];

    // Extract nested data
    const meters = (property as any)?.meters ?? [];
    const leases = (property as any)?.lease_agreements ?? [];
    const expenses = (property as any)?.property_expenses ?? [];

    // Flatten billing items and payments from all leases
    const billingItems = leases.flatMap((lease: any) =>
        (lease.billing_items ?? []).map((item: any) => ({
            ...item,
            lease_id: lease.id,
            tenant_name: lease.tenants ? `${lease.tenants.first_name} ${lease.tenants.last_name}` : null
        }))
    );

    // Flatten all payments from all billing items
    const payments = billingItems.flatMap((item: any) =>
        (item.payments ?? []).map((payment: any) => ({
            ...payment,
            billing_item_id: item.id,
            description: item.description
        }))
    );

    // Calculate financial summary
    const totalBilling = billingItems.reduce((sum: number, item: any) => sum + (item.amount ?? 0), 0);
    const totalPaid = payments.reduce((sum: number, payment: any) => sum + (payment.amount ?? 0), 0);
    const totalBalance = totalBilling - totalPaid;
    const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + (exp.amount ?? 0), 0);
    const netProfit = totalPaid - totalExpenses;

    const error = propertyState.error ?? propertyState.value?.error;

    // Navigation handlers
    const handleMeterClick = (meterId: string) => router.push(routes.landlord.meters({ id: meterId }));
    const handleLeaseClick = (leaseId: string) => router.push(routes.landlord.leases({ id: leaseId }));
    const handleBillingClick = (billingId: string) => router.push(routes.landlord.billing({ id: billingId }));
    const handlePaymentClick = (paymentId: string) => router.push(routes.landlord.payments({ id: paymentId }));
    const handleExpenseClick = (expenseId: string) => router.push(routes.landlord.expenses({ id: expenseId }));
    const handleAttachmentClick = (attachmentId: string) => {
        const attachment = attachments.find(a => a.id === attachmentId);
        attachment && window.open(attachment.file_url, '_blank');
    };

    return (
        <div className={styles.page}>
            <Link href={routes.landlord.properties()} className={styles.backLink}>← Powrot do listy</Link>

            {error ? <ErrorBanner msg={error.message} retry={handleRefresh} /> :
                propertyState.loading ? <Spinner /> :
                    !property ? <ErrorBanner msg="Nie znaleziono nieruchomosci" /> :
                        <>
                            <div className={styles.header}>
                                <h1 className={styles.title}>{property.name}</h1>
                                <Link href={routes.landlord.properties({ action: 'edit', id })} className={styles.editButton}>
                                    Edytuj
                                </Link>
                            </div>

                            <div className={styles.content}>
                                <div className={styles.mainContent}>
                                    {/* Property Details Section */}
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
                                                    property.status === 'occupied' ? styles.statusOccupied :
                                                        styles.statusMaintenance
                                                    }`}>
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
                                        </div>
                                    </div>

                                    {/* Current Lease Section */}
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

                                    {/* Table Components */}
                                    <MetersTable data={meters} onRowClick={handleMeterClick} />
                                    <LeasesTable data={leases} onRowClick={handleLeaseClick} />
                                    <BillingTable data={billingItems} onRowClick={handleBillingClick} />
                                    <PaymentsTable data={payments} onRowClick={handlePaymentClick} />
                                    <ExpensesTable data={expenses} onRowClick={handleExpenseClick} />
                                    <AttachmentsGrid data={attachments} onRowClick={handleAttachmentClick} />
                                </div>

                                {/* Financial Summary Sidebar */}
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
