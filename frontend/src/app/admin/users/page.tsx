'use client';

import { useState } from 'react';
import { useAsync } from 'react-use';
import { useRouter } from 'next/navigation';
import { database } from '@/api/database';
import { Loading } from '@/components/Loading';
import { ErrorBanner } from '@/components/ErrorBanner';
import { Table } from '@/components/Table';
import { FormInput } from '@/components/FormInput';
import { Button } from '@/components/Button';
import styles from './page.module.css';

interface UserWithRole {
    user_id: string;
    role: string;
    created_at: string | null;
}

export default function UsersPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');

    const state = useAsync(async () => {
        // First get user roles
        return await database
            .from('user_roles')
            .select('user_id, role, created_at')
            .order('created_at', { ascending: false });

    }, []);

    const users = state.value?.data ?? [];

    const filteredUsers = users.filter((user: UserWithRole) => {
        const matchesSearch = user.user_id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const formatDate = (dateString: string | null) => {
        return dateString ? new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }) : 'N/A';
    };

    const columns = [
        {
            key: 'user_id',
            header: 'User ID',
            render: (item: UserWithRole) => (
                <span className={styles.userId}>{item.user_id.substring(0, 12)}...</span>
            )
        },
        {
            key: 'role',
            header: 'Role',
            render: (item: UserWithRole) => (
                <span className={`${styles.badge} ${styles[item.role]}`}>
                    {item.role}
                </span>
            )
        },
        {
            key: 'created_at',
            header: 'Created At',
            render: (item: UserWithRole) => formatDate(item.created_at)
        }
    ];

    return (<div>
        {/* {state.loading && <Loading message="Loading users..." />} */}
        {state.error && <ErrorBanner msg={state.error.message} />}
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>User Management</h1>
            </div>

            <div className={styles.filters}>
                <FormInput
                    label="Search by User ID or Email"
                    type="text"
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Enter user ID or email..."
                />

                <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Filter by Role</label>
                    <select
                        className={styles.select}
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="all">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="landlord">Landlord</option>
                        <option value="tenant">Tenant</option>
                    </select>
                </div>
            </div>

            <div className={styles.results}>
                <p className={styles.count}>
                    Showing {filteredUsers.length} of {users.length} users
                </p>
            </div>

            <Table
                columns={columns}
                data={filteredUsers}
                onRowClick={(user) => router.push(`/admin/users/detail?id=${user.user_id}`)}
                emptyMessage="No users found"
            />
        </div>
    </div>
    );
}
