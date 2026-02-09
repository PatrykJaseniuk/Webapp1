'use client';

import { useState } from 'react';
import { useAsync } from 'react-use';
import { useAuth } from '@/contexts/AuthContext';
import { database } from '@/api/database';
import { Loading } from '@/components/Loading';
import { ErrorBanner } from '@/components/ErrorBanner';
import { Table } from '@/components/Table';
import { Card } from '@/components/Card';
import { FormInput } from '@/components/FormInput';
import { Button } from '@/components/Button';
import styles from './page.module.css';

interface BillingItem {
    id: string | null;
    lease_id: string | null;
    item_type: string | null;
    description: string | null;
    amount: number | null;
    due_date: string | null;
    status: string | null;
    balance: number | null;
    is_fully_paid: boolean | null;
}

interface TenantInfo {
    id: string;
    first_name: string;
    last_name: string;
}

export default function TenantPayments() {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const tenantState = useAsync(async () => {
        return !user?.id ? { data: null, error: new Error('No user') } : await (async () => {
            const { data, error } = await database
                .from('tenants')
                .select('id, first_name, last_name')
                .eq('user_id', user.id)
                .single();
            return { data, error };
        })();
    }, [user?.id]);

    const paymentsState = useAsync(async () => {
        const tenantId = tenantState.value?.data?.id;
        return !tenantId ? { data: null, error: new Error('No tenant') } : await (async () => {
            const { data, error } = await database
                .from('billing_with_payments')
                .select('*')
                .eq('lease_id', (
                    await database
                        .from('lease_agreements')
                        .select('id')
                        .eq('tenant_id', tenantId)
                        .eq('status', 'active')
                        .single()
                ).data?.id)
                .order('due_date', { ascending: false });
            return { data, error };
        })();
    }, [tenantState.value?.data?.id]);

    const tenant = tenantState.value?.data as TenantInfo;
    const payments = paymentsState.value?.data ?? [];

    const filteredPayments = payments.filter((payment: BillingItem) => {
        const matchesSearch = (payment.description ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (payment.item_type ?? '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const formatCurrency = (amount: number | null) => `$${amount?.toFixed(2) ?? '0.00'}`;
    const formatDate = (dateString: string | null) => {
        return dateString ? new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }) : 'N/A';
    };

    const getStatusBadge = (status: string | null, isFullyPaid: boolean | null) => {
        const displayStatus = isFullyPaid ? 'paid' : (status ?? 'unknown');
        return (
            <span className={`${styles.badge} ${styles[displayStatus]}`}>
                {displayStatus}
            </span>
        );
    };

    const columns = [
        {
            key: 'description',
            header: 'Description',
            render: (item: BillingItem) => (
                <div>
                    <div className={styles.description}>{item.description}</div>
                    <div className={styles.itemType}>{item.item_type}</div>
                </div>
            )
        },
        {
            key: 'amount',
            header: 'Amount',
            render: (item: BillingItem) => formatCurrency(item.amount)
        },
        {
            key: 'balance',
            header: 'Balance',
            render: (item: BillingItem) => formatCurrency(item.balance)
        },
        {
            key: 'due_date',
            header: 'Due Date',
            render: (item: BillingItem) => formatDate(item.due_date)
        },
        {
            key: 'status',
            header: 'Status',
            render: (item: BillingItem) => getStatusBadge(item.status, item.is_fully_paid)
        }
    ];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Payment History</h1>
                <p className={styles.subtitle}>View your billing items and payment status</p>
            </div>

            {tenantState.error && <ErrorBanner msg={tenantState.error.message} />}

            <div className={styles.filters}>
                <FormInput
                    label="Search"
                    type="text"
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search by description or type..."
                />

                <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Filter by Status</label>
                    <select
                        className={styles.select}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="overdue">Overdue</option>
                    </select>
                </div>
            </div>

            <div className={styles.results}>
                <p className={styles.count}>
                    Showing {filteredPayments.length} of {payments.length} payments
                </p>
            </div>

            <Card title="Billing Items">
                <Table
                    columns={columns}
                    data={filteredPayments}
                    onRowClick={(payment) => window.location.href = `/tenant/payments?id=${payment.id}`}
                    emptyMessage="No payments found"
                />
            </Card>
        </div>
    );
}