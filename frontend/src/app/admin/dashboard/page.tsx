'use client';

import { useAsync } from 'react-use';
import { database } from '@/api/database';
import { Loading } from '@/components/Loading';
import { ErrorBanner } from '@/components/ErrorBanner';
import { StatCard } from '@/components/StatCard';
import { Card } from '@/components/Card';
import styles from './page.module.css';

interface UserRole {
    user_id: string;
    role: string;
    created_at: string | null;
}

export default function AdminDashboard() {
    const state = useAsync(async () => {
        const { data, error } = await database
            .from('user_roles')
            .select('user_id, role, created_at')
            .order('created_at', { ascending: false });

        return { data, error };
    }, []);

    const users = state.value?.data ?? [];
    const totalUsers = users.length;
    const adminCount = users.filter((u: UserRole) => u.role === 'admin').length;
    const landlordCount = users.filter((u: UserRole) => u.role === 'landlord').length;
    const tenantCount = users.filter((u: UserRole) => u.role === 'tenant').length;
    const recentUsers = users.slice(0, 10);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return state.loading ? <Loading message="Loading dashboard..." /> :
        state.error ? <ErrorBanner msg={state.error.message} /> : (
            <div className={styles.container}>
                <h1 className={styles.title}>Admin Dashboard</h1>

                <div className={styles.statsGrid}>
                    <StatCard
                        label="Total Users"
                        value={totalUsers}
                        icon="👥"
                        color="blue"
                    />
                    <StatCard
                        label="Admins"
                        value={adminCount}
                        icon="🔐"
                        color="purple"
                    />
                    <StatCard
                        label="Landlords"
                        value={landlordCount}
                        icon="🏢"
                        color="orange"
                    />
                    <StatCard
                        label="Tenants"
                        value={tenantCount}
                        icon="🏠"
                        color="green"
                    />
                </div>

                <Card title="Recent Signups">
                    <div className={styles.recentUsers}>
                        {recentUsers.length === 0 ? (
                            <p className={styles.emptyState}>No users yet</p>
                        ) : (
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>User ID</th>
                                        <th>Role</th>
                                        <th>Created At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentUsers.map((user: UserRole) => (
                                        <tr key={user.user_id}>
                                            <td className={styles.userId}>{user.user_id.substring(0, 8)}...</td>
                                            <td>
                                                <span className={`${styles.badge} ${styles[user.role]}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td>{user.created_at ? formatDate(user.created_at) : 'N/A'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </Card>
            </div>
        );
}
