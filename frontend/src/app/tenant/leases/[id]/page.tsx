'use client';

import { useAsync } from 'react-use';
import { useAuth } from '@/contexts/AuthContext';
import { database } from '@/api/database';
import { Loading } from '@/components/Loading';
import { ErrorBanner } from '@/components/ErrorBanner';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import styles from './page.module.css';

interface LeaseDetails {
    id: string;
    property_name: string;
    property_address: string;
    monthly_rent: number;
    start_date: string;
    end_date: string | null;
    days_active: number;
    days_until_end: number | null;
    tenant_name: string;
    tenant_email: string;
    tenant_phone: string;
}

export default function TenantLeaseDetails({ params }: { params: { id: string } }) {
    const { user } = useAuth();

    const leaseState = useAsync(async () => {
        return !user?.id ? { data: null, error: new Error('No user') } : await (async () => {
            // First verify this lease belongs to the current tenant
            const tenantResult = await database
                .from('tenants')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (tenantResult.error) {
                return { data: null, error: new Error('Tenant not found') };
            }

            const { data, error } = await database
                .from('active_leases')
                .select('*')
                .eq('id', params.id)
                .eq('tenant_id', tenantResult.data.id)
                .single();

            return { data, error };
        })();
    }, [user?.id, params.id]);

    const lease = leaseState.value?.data as LeaseDetails;

    const formatCurrency = (amount: number) => `$${amount?.toFixed(2) ?? '0.00'}`;
    const formatDate = (dateString: string | null) => {
        return dateString ? new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) : 'No end date';
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Button
                    label="← Back to Dashboard"
                    onClick={() => window.location.href = '/tenant/dashboard'}
                    variant="secondary"
                />
            </div>

            {leaseState.error && <ErrorBanner msg={leaseState.error.message} />}

            {lease && (
                <>
                    <div className={styles.titleSection}>
                        <h1 className={styles.title}>Lease Details</h1>
                        <p className={styles.subtitle}>Property: {lease.property_name}</p>
                    </div>

                    <Card title="Property Information">
                        <div className={styles.infoGrid}>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>Property Name:</span>
                                <span className={styles.value}>{lease.property_name}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>Address:</span>
                                <span className={styles.value}>{lease.property_address}</span>
                            </div>
                        </div>
                    </Card>

                    <Card title="Lease Terms">
                        <div className={styles.infoGrid}>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>Monthly Rent:</span>
                                <span className={styles.value}>{formatCurrency(lease.monthly_rent)}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>Lease Start:</span>
                                <span className={styles.value}>{formatDate(lease.start_date)}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>Lease End:</span>
                                <span className={styles.value}>{formatDate(lease.end_date)}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>Days Active:</span>
                                <span className={styles.value}>{lease.days_active} days</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>Days Until End:</span>
                                <span className={styles.value}>
                                    {lease.days_until_end !== null ? `${lease.days_until_end} days` : 'Ongoing lease'}
                                </span>
                            </div>
                        </div>
                    </Card>

                    <Card title="Contact Information">
                        <div className={styles.contactInfo}>
                            <p className={styles.contactText}>
                                For any lease-related questions or maintenance requests,
                                please contact your landlord directly.
                            </p>
                            <div className={styles.contactDetails}>
                                <div className={styles.contactItem}>
                                    <span className={styles.contactLabel}>Tenant:</span>
                                    <span className={styles.contactValue}>{lease.tenant_name}</span>
                                </div>
                                <div className={styles.contactItem}>
                                    <span className={styles.contactLabel}>Email:</span>
                                    <span className={styles.contactValue}>{lease.tenant_email}</span>
                                </div>
                                <div className={styles.contactItem}>
                                    <span className={styles.contactLabel}>Phone:</span>
                                    <span className={styles.contactValue}>{lease.tenant_phone}</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </>
            )}
        </div>
    );
}