'use client';

import { useState } from 'react';
import { useAsync } from 'react-use';
import Link from 'next/link';

import { routes } from '@/routes';
import { database } from '@/api/database';
import { Spinner } from '@/components/shared/Spinner';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { PROPERTY_STATUS_LABELS, PROPERTY_TYPE_LABELS, TRANSACTION_TYPE_LABELS, TRANSACTION_STATUS_LABELS, TENANT_STATUS_LABELS } from '@/constants/labels';

import { AttachmentsGrid } from './lists/AttachmentsGrid';

import styles from './DetailPage.module.css';

interface TransactionDetailProps {
    id: string;
}

export const TransactionDetail = ({ id }: TransactionDetailProps) => {
    const [refreshKey, setRefreshKey] = useState(0);
    const handleRefresh = () => setRefreshKey(prev => prev + 1);

    // Transaction query
    const transactionState = useAsync(async () => {
        const { data, error } = await database
            .from('transactions')
            .select('*')
            .eq('id', id)
            .single();
        return { data, error };
    }, [id, refreshKey]);

    // Get lease details if lease_id exists
    const leaseState = useAsync(async () => {
        const tx = transactionState.value?.data;
        if (!tx?.lease_id) return { data: null, error: null };

        const { data, error } = await database
            .from('lease_agreements')
            .select('*, tenants(first_name, last_name, email, phone), properties(name, address)')
            .eq('id', tx.lease_id)
            .single();
        return { data, error };
    }, [id, refreshKey]);

    // Get property details if property_id exists (for property-level transactions)
    const propertyState = useAsync(async () => {
        const tx = transactionState.value?.data;
        if (!tx?.property_id || tx?.lease_id) return { data: null, error: null };

        const { data, error } = await database
            .from('properties')
            .select('*')
            .eq('id', tx.property_id)
            .single();
        return { data, error };
    }, [id, refreshKey]);

    // Attachments for this transaction
    const attachmentsState = useAsync(async () => {
        const { data, error } = await database
            .from('attachments')
            .select('*')
            .eq('related_to_type', 'transaction')
            .eq('related_to_id', id)
            .order('created_at', { ascending: false });
        return { data, error };
    }, [id, refreshKey]);

    const transaction = transactionState.value?.data;
    const lease = leaseState.value?.data;
    const property = propertyState.value?.data;
    const attachments = attachmentsState.value?.data ?? [];

    const error = transactionState.error ?? transactionState.value?.error;

    return (
        <div className={styles.page}>
            <Link href={routes.landlord.payments()} className={styles.backLink}>← Powrot do listy</Link>

            {error ? <ErrorBanner msg={error.message} retry={handleRefresh} /> :
                transactionState.loading ? <Spinner /> :
                    !transaction ? <ErrorBanner msg="Nie znaleziono transakcji" /> :
                        <>
                            <div className={styles.header}>
                                <h1 className={styles.title}>Transakcja</h1>
                            </div>

                            <div className={styles.content}>
                                <div className={styles.mainContent}>
                                    {/* Transaction Details Section */}
                                    <div className={styles.section}>
                                        <h2 className={styles.sectionTitle}>Szczegoly transakcji</h2>
                                        <div className={styles.infoGrid}>
                                            <div className={styles.infoItem}>
                                                <span className={styles.infoLabel}>Typ</span>
                                                <span className={styles.infoValue}>
                                                    {TRANSACTION_TYPE_LABELS[transaction.type ?? ''] ?? transaction.type}
                                                </span>
                                            </div>
                                            <div className={styles.infoItem}>
                                                <span className={styles.infoLabel}>Kwota</span>
                                                <span className={`${styles.infoValueAmount} ${Number(transaction.amount) >= 0 ? styles.positive : styles.negative}`}>
                                                    {formatCurrency(Number(transaction.amount))}
                                                </span>
                                            </div>
                                            <div className={styles.infoItem}>
                                                <span className={styles.infoLabel}>Status</span>
                                                <span className={`${styles.statusBadge} ${transaction.status === 'paid' ? styles.statusActive :
                                                    transaction.status === 'overdue' ? styles.statusOverdue : styles.statusPending
                                                    }`}>
                                                    {TRANSACTION_STATUS_LABELS[transaction.status ?? ''] ?? transaction.status}
                                                </span>
                                            </div>
                                            <div className={styles.infoItem}>
                                                <span className={styles.infoLabel}>Termin platnosci</span>
                                                <span className={styles.infoValue}>
                                                    {transaction.due_date ? formatDate(transaction.due_date) : '—'}
                                                </span>
                                            </div>
                                            <div className={styles.infoItem}>
                                                <span className={styles.infoLabel}>Opis</span>
                                                <span className={styles.infoValue}>{transaction.description}</span>
                                            </div>
                                            {transaction.created_at && (
                                                <div className={styles.infoItem}>
                                                    <span className={styles.infoLabel}>Utworzono</span>
                                                    <span className={styles.infoValue}>
                                                        {formatDate(transaction.created_at)}
                                                    </span>
                                                </div>
                                            )}
                                            {transaction.created_by && (
                                                <div className={styles.infoItem}>
                                                    <span className={styles.infoLabel}>Tworca</span>
                                                    <span className={styles.infoValue}>
                                                        {transaction.created_by.substring(0, 8)}...
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Lease Reference */}
                                    {lease && (
                                        <div className={styles.section}>
                                            <h2 className={styles.sectionTitle}>Umowa najmu</h2>
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
                                                    <span className={styles.infoLabel}>Adres</span>
                                                    <span className={styles.infoValueAddress}>
                                                        {(lease as any).properties?.address ?? '—'}
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
                                                    <span className={styles.infoLabel}>Okres</span>
                                                    <span className={styles.infoValue}>
                                                        {lease.start_date} — {lease.end_date ?? 'Bezterminowa'}
                                                    </span>
                                                </div>
                                                <div className={styles.infoItem}>
                                                    <span className={styles.infoLabel}>Czynsz</span>
                                                    <span className={styles.infoValueAmount}>
                                                        {formatCurrency(lease.monthly_rent)}
                                                    </span>
                                                </div>
                                            </div>
                                            <Link href={routes.landlord.leases({ id: lease.id })} className={styles.editButton}>
                                                Szczegoly umowy →
                                            </Link>
                                        </div>
                                    )}

                                    {/* Property Reference (for property-level transactions) */}
                                    {property && !lease && (
                                        <div className={styles.section}>
                                            <h2 className={styles.sectionTitle}>Nieruchomosc</h2>
                                            <div className={styles.infoGrid}>
                                                <div className={styles.infoItem}>
                                                    <span className={styles.infoLabel}>Nazwa</span>
                                                    <span className={styles.infoValue}>
                                                        <Link href={routes.landlord.properties({ id: property.id })}>
                                                            {property.name}
                                                        </Link>
                                                    </span>
                                                </div>
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
                                                        property.status === 'occupied' ? styles.statusOccupied : styles.statusMaintenance
                                                        }`}>
                                                        {PROPERTY_STATUS_LABELS[property.status ?? ''] ?? property.status}
                                                    </span>
                                                </div>
                                                <div className={styles.infoItem}>
                                                    <span className={styles.infoLabel}>Czynsz</span>
                                                    <span className={styles.infoValueAmount}>{formatCurrency(property.monthly_rent)}</span>
                                                </div>
                                            </div>
                                            <Link href={routes.landlord.properties({ id: property.id })} className={styles.editButton}>
                                                Szczegoly nieruchomosci →
                                            </Link>
                                        </div>
                                    )}

                                    {/* Attachments */}
                                    <AttachmentsGrid data={attachments} onRowClick={(attachmentId: string) => {
                                        const attachment = attachments.find(a => a.id === attachmentId);
                                        attachment && window.open(attachment.file_url, '_blank');
                                    }} />
                                </div>

                                {/* Financial Summary Sidebar */}
                                <div className={styles.sidebar}>
                                    <div className={styles.summaryCard}>
                                        <h3 className={styles.summaryTitle}>Podsumowanie</h3>
                                        <div className={styles.summaryRow}>
                                            <span>Kwota</span>
                                            <span className={Number(transaction.amount) >= 0 ? styles.positive : styles.negative}>
                                                {formatCurrency(Number(transaction.amount))}
                                            </span>
                                        </div>
                                        <div className={styles.summaryRow}>
                                            <span>Status</span>
                                            <span>{TRANSACTION_STATUS_LABELS[transaction.status ?? ''] ?? transaction.status}</span>
                                        </div>
                                        <div className={styles.summaryDivider} />
                                        <div className={styles.summaryRow}>
                                            <span>Termin</span>
                                            <span>{transaction.due_date ? formatDate(transaction.due_date) : '—'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
            }
        </div>
    );
};
