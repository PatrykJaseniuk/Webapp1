'use client';

import { useAsync } from 'react-use';
import { useAuth } from '@/contexts/AuthContext';
import { database } from '@/api/database';
import { Loading } from '@/components/Loading';
import { ErrorBanner } from '@/components/ErrorBanner';
import { Card } from '@/components/Card';
import styles from './page.module.css';

interface TenantProfile {
    id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    id_document_number: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    notes: string | null;
    status: string;
    created_at: string;
    updated_at: string;
}

export default function TenantProfile() {
    const { user } = useAuth();

    const profileState = useAsync(async () => {
        return !user?.id ? { data: null, error: new Error('No user') } : await (async () => {
            const { data, error } = await database
                .from('tenants')
                .select('*')
                .eq('user_id', user.id)
                .single();
            return { data, error };
        })();
    }, [user?.id]);

    const profile = profileState.value?.data as TenantProfile;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status: string) => {
        return (
            <span className={`${styles.badge} ${styles[status]}`}>
                {status}
            </span>
        );
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>My Profile</h1>
                <p className={styles.subtitle}>View your account information</p>
            </div>

            {profileState.error && <ErrorBanner msg={profileState.error.message} />}

            {profile && (
                <>
                    <Card title="Personal Information">
                        <div className={styles.infoGrid}>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>First Name:</span>
                                <span className={styles.value}>{profile.first_name}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>Last Name:</span>
                                <span className={styles.value}>{profile.last_name}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>Email:</span>
                                <span className={styles.value}>{profile.email}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>Phone:</span>
                                <span className={styles.value}>{profile.phone}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>ID Document:</span>
                                <span className={styles.value}>{profile.id_document_number ?? 'Not provided'}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>Status:</span>
                                {getStatusBadge(profile.status)}
                            </div>
                        </div>
                    </Card>

                    <Card title="Emergency Contact">
                        <div className={styles.infoGrid}>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>Name:</span>
                                <span className={styles.value}>{profile.emergency_contact_name ?? 'Not provided'}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>Phone:</span>
                                <span className={styles.value}>{profile.emergency_contact_phone ?? 'Not provided'}</span>
                            </div>
                        </div>
                    </Card>

                    {profile.notes && (
                        <Card title="Additional Notes">
                            <p className={styles.notes}>{profile.notes}</p>
                        </Card>
                    )}

                    <Card title="Account Details">
                        <div className={styles.infoGrid}>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>Tenant ID:</span>
                                <span className={styles.value}>{profile.id}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>User ID:</span>
                                <span className={styles.value}>{profile.user_id}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>Created:</span>
                                <span className={styles.value}>{formatDate(profile.created_at)}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>Last Updated:</span>
                                <span className={styles.value}>{formatDate(profile.updated_at)}</span>
                            </div>
                        </div>
                    </Card>
                </>
            )}
        </div>
    );
}