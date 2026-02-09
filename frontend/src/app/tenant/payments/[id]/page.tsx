'use client';

import { useAsync } from 'react-use';
import { useAuth } from '@/contexts/AuthContext';
import { database } from '@/api/database';
import { Loading } from '@/components/Loading';
import { ErrorBanner } from '@/components/ErrorBanner';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Table } from '@/components/Table';
import styles from './page.module.css';

interface BillingItem {
    id: string;
    lease_id: string;
    item_type: string;
    description: string;
    amount: number;
    due_date: string;
    status: string;
    balance: number;
    is_fully_paid: boolean;
}

interface Payment {
    id: string | null;
    billing_item_id: string | null;
    amount: number | null;
    payment_date: string | null;
    payment_method: string | null;
    notes: string | null;
}

export default function TenantPaymentDetails({ params }: { params: { id: string } }) {
    const { user } = useAuth();

    const billingState = useAsync(async () => {
        return !user?.id ? { data: null, error: new Error('No user') } : await (async () => {
            // First verify this billing item belongs to the current tenant
            const tenantResult = await database
                .from('tenants')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (tenantResult.error) {
                return { data: null, error: new Error('Tenant not found') };
            }

            const { data, error } = await database
                .from('billing_with_payments')
                .select('*')
                .eq('id', params.id)
                .single();

            // Additional check to ensure this billing item belongs to tenant's lease
            if (data) {
                const leaseCheck = await database
                    .from('lease_agreements')
                    .select('id')
                    .eq('id', data.lease_id ?? "")
                    .eq('tenant_id', tenantResult.data.id)
                    .single();

                if (leaseCheck.error) {
                    return { data: null, error: new Error('Access denied') };
                }
            }

            return { data, error };
        })();
    }, [user?.id, params.id]);

    const paymentsState = useAsync(async () => {
        return !params.id ? { data: null, error: new Error('No billing ID') } : await (async () => {
            const { data, error } = await database
                .from('payments')
                .select('*')
                .eq('billing_item_id', params.id)
                .order('payment_date', { ascending: false });

            return { data, error };
        })();
    }, [params.id]);

    const billing = billingState.value?.data as BillingItem;
    const payments = paymentsState.value?.data ?? [];

    const formatCurrency = (amount: number) => `$${amount?.toFixed(2) ?? '0.00'}`;
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusBadge = (status: string, isFullyPaid: boolean) => {
        const displayStatus = isFullyPaid ? 'paid' : status;
        return (
            <span className={`${styles.badge} ${styles[displayStatus]}`}>
                {displayStatus}
            </span>
        );
    };

    const paymentColumns = [
        {
            key: 'payment_date',
            header: 'Payment Date',
            render: (item: Payment) => item.payment_date ? formatDate(item.payment_date) : 'Unknown'
        },
        {
            key: 'amount',
            header: 'Amount',
            render: (item: Payment) => formatCurrency(item.amount ?? 0)
        },
        {
            key: 'payment_method',
            header: 'Method',
            render: (item: Payment) => (
                <span className={styles.methodBadge}>
                    {(item.payment_method ?? 'unknown').replace('_', ' ')}
                </span>
            )
        },
        {
            key: 'notes',
            header: 'Notes',
            render: (item: Payment) => item.notes ?? 'No notes'
        }
    ];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Button
                    label="← Back to Payments"
                    onClick={() => window.location.href = '/tenant/payments'}
                    variant="secondary"
                />
            </div>

            {billingState.error && <ErrorBanner msg={billingState.error.message} />}

            {billing && (
                <>
                    <div className={styles.titleSection}>
                        <h1 className={styles.title}>Payment Details</h1>
                        <p className={styles.subtitle}>{billing.description}</p>
                    </div>

                    <Card title="Billing Information">
                        <div className={styles.billingGrid}>
                            <div className={styles.billingItem}>
                                <span className={styles.label}>Description:</span>
                                <span className={styles.value}>{billing.description}</span>
                            </div>
                            <div className={styles.billingItem}>
                                <span className={styles.label}>Type:</span>
                                <span className={styles.value}>{billing.item_type}</span>
                            </div>
                            <div className={styles.billingItem}>
                                <span className={styles.label}>Amount:</span>
                                <span className={styles.value}>{formatCurrency(billing.amount)}</span>
                            </div>
                            <div className={styles.billingItem}>
                                <span className={styles.label}>Due Date:</span>
                                <span className={styles.value}>{formatDate(billing.due_date)}</span>
                            </div>
                            <div className={styles.billingItem}>
                                <span className={styles.label}>Balance:</span>
                                <span className={styles.value}>{formatCurrency(billing.balance)}</span>
                            </div>
                            <div className={styles.billingItem}>
                                <span className={styles.label}>Status:</span>
                                {getStatusBadge(billing.status, billing.is_fully_paid)}
                            </div>
                        </div>
                    </Card>

                    <Card title="Payment History">
                        {payments.length === 0 ? (
                            <p className={styles.noPayments}>No payments have been made for this billing item.</p>
                        ) : (
                            <Table
                                columns={paymentColumns}
                                data={payments}
                                emptyMessage="No payment history"
                            />
                        )}
                    </Card>
                </>
            )}
        </div>
    );
}