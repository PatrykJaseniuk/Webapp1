'use client';

import { useAsync } from 'react-use';
import { useAuth } from '@/contexts/AuthContext';
import { database } from '@/api/database';
import { Loading } from '@/components/Loading';
import { ErrorBanner } from '@/components/ErrorBanner';
import { Card } from '@/components/Card';
import { StatCard } from '@/components/StatCard';
import styles from './page.module.css';

interface TenantInfo {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
}

interface LeaseInfo {
    id: string;
    property_name: string;
    property_address: string;
    monthly_rent: number;
    start_date: string;
    end_date: string | null;
    days_active: number;
    days_until_end: number | null;
}

interface PaymentSummary {
    total_unpaid_amount: number;
    unpaid_items_count: number;
    earliest_due_date: string | null;
    total_overdue_amount: number;
    overdue_items_count: number;
}

export default function TenantDashboard() {
    const { user } = useAuth();

    const tenantState = useAsync(async () => {
        return !user?.id ? { data: null, error: new Error('No user') } : await (async () => {
            const { data, error } = await database
                .from('tenants')
                .select('id, first_name, last_name, email')
                .eq('user_id', user.id)
                .single();
            return { data, error };
        })();
    }, [user?.id]);

    const leaseState = useAsync(async () => {
        const tenantId = tenantState.value?.data?.id;
        return !tenantId ? { data: null, error: new Error('No tenant') } : await (async () => {
            const { data, error } = await database
                .from('active_leases')
                .select('id, property_name, property_address, monthly_rent, start_date, end_date, days_active, days_until_end')
                .eq('tenant_id', tenantId)
                .single();
            return { data, error };
        })();
    }, [tenantState.value?.data?.id]);

    const paymentSummaryState = useAsync(async () => {
        const tenantId = tenantState.value?.data?.id;
        return !tenantId ? { data: null, error: new Error('No tenant') } : await (async () => {
            const { data, error } = await database
                .from('unpaid_billing_summary')
                .select('total_unpaid_amount, unpaid_items_count, earliest_due_date, total_overdue_amount, overdue_items_count')
                .eq('tenant_id', tenantId)
                .single();
            return { data, error };
        })();
    }, [tenantState.value?.data?.id]);

    const tenant = tenantState.value?.data as TenantInfo;
    const lease = leaseState.value?.data as LeaseInfo;
    const paymentSummary = paymentSummaryState.value?.data as PaymentSummary;

    const formatCurrency = (amount: number) => `$${amount?.toFixed(2) ?? '0.00'}`;
    const formatDate = (dateString: string | null) => {
        return dateString ? new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }) : 'N/A';
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>
                    Welcome back, {tenant?.first_name ?? 'Tenant'}!
                </h1>
                <p className={styles.subtitle}>Here's your rental overview</p>
            </div>

            {tenantState.error && <ErrorBanner msg={tenantState.error.message} />}

            <div className={styles.statsGrid}>
                <StatCard
                    label="Monthly Rent"
                    value={formatCurrency(lease?.monthly_rent ?? 0)}
                    icon="💰"
                    color="blue"
                />
                <StatCard
                    label="Outstanding Balance"
                    value={formatCurrency(paymentSummary?.total_unpaid_amount ?? 0)}
                    icon="💳"
                    color={paymentSummary?.total_unpaid_amount > 0 ? 'orange' : 'green'}
                />
                <StatCard
                    label="Overdue Amount"
                    value={formatCurrency(paymentSummary?.total_overdue_amount ?? 0)}
                    icon="⚠️"
                    color={paymentSummary?.total_overdue_amount > 0 ? 'orange' : 'green'}
                />
                <StatCard
                    label="Lease Status"
                    value={lease ? 'Active' : 'No Lease'}
                    icon={lease ? '✅' : '❌'}
                    color={lease ? 'green' : 'orange'}
                />
            </div>

            {lease && (
                <Card title="Current Lease">
                    <div className={styles.leaseGrid}>
                        <div className={styles.leaseItem}>
                            <span className={styles.label}>Property:</span>
                            <span className={styles.value}>{lease.property_name}</span>
                        </div>
                        <div className={styles.leaseItem}>
                            <span className={styles.label}>Address:</span>
                            <span className={styles.value}>{lease.property_address}</span>
                        </div>
                        <div className={styles.leaseItem}>
                            <span className={styles.label}>Start Date:</span>
                            <span className={styles.value}>{formatDate(lease.start_date)}</span>
                        </div>
                        <div className={styles.leaseItem}>
                            <span className={styles.label}>End Date:</span>
                            <span className={styles.value}>{formatDate(lease.end_date)}</span>
                        </div>
                        <div className={styles.leaseItem}>
                            <span className={styles.label}>Days Until End:</span>
                            <span className={styles.value}>
                                {lease.days_until_end !== null ? `${lease.days_until_end} days` : 'Ongoing'}
                            </span>
                        </div>
                    </div>
                </Card>
            )}

            {paymentSummary?.earliest_due_date && (
                <Card title="Payment Information">
                    <div className={styles.paymentInfo}>
                        <p className={styles.paymentText}>
                            Next payment due: <strong>{formatDate(paymentSummary.earliest_due_date)}</strong>
                        </p>
                        {paymentSummary.total_overdue_amount > 0 && (
                            <p className={styles.overdueText}>
                                ⚠️ You have overdue payments totaling {formatCurrency(paymentSummary.total_overdue_amount)}
                            </p>
                        )}
                    </div>
                </Card>
            )}
        </div>
    );
}