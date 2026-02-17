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
import { PROPERTY_STATUS_LABELS, PROPERTY_TYPE_LABELS, TRANSACTION_TYPE_LABELS, TRANSACTION_STATUS_LABELS } from '@/constants/labels';

import { AttachmentsGrid } from './lists/AttachmentsGrid';

import detailStyles from './DetailPage.module.css';
import formStyles from './FormPage.module.css';

const styles = detailStyles;

interface TransactionSingleProps {
    id?: string;
}

export const TransactionSingle = ({ id }: TransactionSingleProps) => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const action = searchParams.get('action') || 'detail';
    // For transactions, both 'edit' and 'new' go to edit mode (new creates from lease, not manually)
    const isEditMode = action === 'edit' || action === 'new';

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

    // Transaction query - only when id exists
    const transactionState = useAsync(async () => {
        const shouldFetch = id;
        return shouldFetch
            ? database.from('transactions').select('*').eq('id', id).single().then(r => ({ data: r.data, error: r.error }))
            : { data: null, error: null };
    }, [id, refreshKey]);

    // Get lease details if lease_id exists
    const leaseState = useAsync(async () => {
        const tx = transactionState.value?.data;
        const leaseId = tx?.lease_id;
        const shouldFetch = leaseId;
        return shouldFetch
            ? database.from('lease_agreements').select('*, tenants(first_name, last_name, email, phone), properties(name, address)').eq('id', leaseId).single().then(r => ({ data: r.data, error: r.error }))
            : { data: null, error: null };
    }, [id, refreshKey, transactionState.value?.data?.lease_id]);

    // Get property details if property_id exists (for property-level transactions)
    const propertyState = useAsync(async () => {
        const tx = transactionState.value?.data;
        const propId = tx?.property_id;
        const hasLease = tx?.lease_id;
        const shouldFetch = propId && !hasLease;
        return shouldFetch
            ? database.from('properties').select('*').eq('id', propId).single().then(r => ({ data: r.data, error: r.error }))
            : { data: null, error: null };
    }, [id, refreshKey, transactionState.value?.data?.property_id, transactionState.value?.data?.lease_id]);

    // Attachments for this transaction
    const attachmentsState = useAsync(async () => {
        const shouldFetch = id;
        return shouldFetch
            ? database.from('attachments').select('*').eq('related_to_type', 'transaction').eq('related_to_id', id).order('created_at', { ascending: false }).then(r => ({ data: r.data ?? [], error: r.error }))
            : { data: [], error: null };
    }, [id, refreshKey]);

    const transaction = transactionState.value?.data;
    const lease = leaseState.value?.data;
    const property = propertyState.value?.data;
    const attachments = attachmentsState.value?.data ?? [];

    const error = transactionState.error ?? transactionState.value?.error;

    // Render view mode
    const renderViewMode = () => (
        <div className={styles.page}>
            <Link href={routes.landlord.payments()} className={styles.backLink}>← Powrot do listy</Link>

            {error
                ? <ErrorBanner msg={error.message} retry={handleRefresh} />
                : transactionState.loading
                    ? <Spinner />
                    : !transaction
                        ? <ErrorBanner msg="Nie znaleziono transakcji" />
                        : <>
                            <div className={styles.header}>
                                <h1 className={styles.title}>Transakcja</h1>
                                <button onClick={navigateToEdit} className={styles.editButton}>
                                    Edytuj
                                </button>
                            </div>

                            <div className={styles.content}>
                                <div className={styles.mainContent}>
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
                                                    transaction.status === 'overdue' ? styles.statusOverdue : styles.statusPending}`}>
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
                                                        property.status === 'occupied' ? styles.statusOccupied : styles.statusMaintenance}`}>
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

                                    <AttachmentsGrid data={attachments} onRowClick={(attachmentId: string) => {
                                        const attachment = attachments.find(a => a.id === attachmentId);
                                        attachment && window.open(attachment.file_url, '_blank');
                                    }} />
                                </div>

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

    // Render edit mode - includes payment registration for pending transactions
    const renderEditMode = () => {
        const [amount, setAmount] = useState('');
        const [description, setDescription] = useState('');
        const [status, setStatus] = useState('pending');

        // Payment registration state
        const [registerPayment, setRegisterPayment] = useState(false);
        const [paymentAmount, setPaymentAmount] = useState('');

        useEffect(() => {
            transaction && (
                setAmount(transaction.amount?.toString() ?? ''),
                setDescription(transaction.description ?? ''),
                setStatus(transaction.status)
            );
        }, [transaction]);

        const [submitState, handleSubmit] = useAsyncFn(async () => {
            // If registering a payment, update status to paid
            if (registerPayment && id) {
                const { error } = await database
                    .from('transactions')
                    .update({
                        status: 'paid',
                        amount: parseFloat(paymentAmount || amount)
                    })
                    .eq('id', id);

                !error && (handleRefresh(), navigateToDetail());
                return { error };
            }

            // Regular update - transactions can't be created manually
            const payload = {
                amount: parseFloat(amount),
                description,
                status,
            };

            const { error } = await database.from('transactions').update(payload).eq('id', id!);

            !error && (handleRefresh(), navigateToDetail());
            return { error };
        }, [amount, description, status, id, registerPayment, paymentAmount]);

        return (
            <div className={formStyles.page}>
                <button onClick={navigateToDetail} className={formStyles.backLink}>← Powrot do szczegolow</button>

                <h1 className={formStyles.title}>
                    {registerPayment
                        ? 'Zarejestruj platnosc'
                        : 'Edytuj transakcje'}
                </h1>

                {transactionState.loading
                    ? <Spinner />
                    : <form className={formStyles.form} onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                        {(submitState.error || submitState.value?.error) && (
                            <div>
                                {submitState.error && <ErrorBanner msg={submitState.error.message} />}
                                {submitState.value?.error && <ErrorBanner msg={submitState.value.error.message} />}
                            </div>
                        )}

                        {transaction?.status === 'pending' && !registerPayment && (
                            <div style={{ marginBottom: 'var(--spacing-lg)', padding: 'var(--spacing-md)', backgroundColor: 'var(--color-primary-light)', borderRadius: 'var(--radius-md)' }}>
                                <button
                                    type="button"
                                    onClick={() => setRegisterPayment(true)}
                                    style={{
                                        backgroundColor: 'var(--color-success)',
                                        color: 'white',
                                        border: 'none',
                                        padding: 'var(--spacing-sm) var(--spacing-lg)',
                                        borderRadius: 'var(--radius-md)',
                                        cursor: 'pointer',
                                        fontWeight: 600
                                    }}
                                >
                                    Zarejestruj platnosc
                                </button>
                            </div>
                        )}

                        {registerPayment ? (
                            <>
                                <div className={formStyles.formField}>
                                    <label htmlFor="paymentAmount">Kwota platnosci (PLN)</label>
                                    <input
                                        id="paymentAmount"
                                        type="number"
                                        step="0.01"
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                        required
                                        placeholder={amount || 'np. 2500.00'}
                                    />
                                </div>
                                <button type="submit" className={formStyles.submitButton} disabled={submitState.loading}>
                                    {submitState.loading ? 'Zapisywanie...' : 'Zarejestruj platnosc'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRegisterPayment(false)}
                                    style={{
                                        backgroundColor: 'transparent',
                                        color: 'var(--color-text-secondary)',
                                        border: '1px solid var(--color-border)',
                                        padding: 'var(--spacing-sm) var(--spacing-lg)',
                                        borderRadius: 'var(--radius-md)',
                                        cursor: 'pointer',
                                        marginLeft: 'var(--spacing-sm)'
                                    }}
                                >
                                    Anuluj
                                </button>
                            </>
                        ) : (
                            <>
                                <div className={formStyles.formField}>
                                    <label htmlFor="amount">Kwota (PLN)</label>
                                    <input
                                        id="amount"
                                        type="number"
                                        step="0.01"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        required
                                        placeholder="np. 2500.00"
                                    />
                                </div>

                                <div className={formStyles.formField}>
                                    <label htmlFor="description">Opis</label>
                                    <textarea
                                        id="description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Dodatkowe informacje..."
                                    />
                                </div>

                                <div className={formStyles.formField}>
                                    <label htmlFor="status">Status</label>
                                    <select
                                        id="status"
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                    >
                                        <option value="pending">Oczekujaca</option>
                                        <option value="paid">Oplacona</option>
                                        <option value="overdue">Przeterminowana</option>
                                    </select>
                                </div>

                                <button type="submit" className={formStyles.submitButton} disabled={submitState.loading}>
                                    {submitState.loading ? 'Zapisywanie...' : 'Zapisz zmiany'}
                                </button>
                            </>
                        )}
                    </form>
                }
            </div>
        );
    };

    return isEditMode
        ? renderEditMode()
        : renderViewMode();
};
