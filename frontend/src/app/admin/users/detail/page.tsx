'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAsync, useAsyncFn } from 'react-use';
import { database } from '@/api/database';
import { Loading } from '@/components/Loading';
import { ErrorBanner } from '@/components/ErrorBanner';
import { SuccessBanner } from '@/components/SuccessBanner';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import styles from './page.module.css';
import { loadComponents } from 'next/dist/server/load-components';

interface UserRole {
    user_id: string;
    role: string;
    created_at: string | null;
    updated_at: string | null;
    email: string | null;
}

const UserDetailContent = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const userId = searchParams.get('id');

    const [selectedRole, setSelectedRole] = useState<string>('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string>('');

    const [updateState, handleUpdateRole] = useAsyncFn(async () => {
        return !userId ? { error: new Error('No user ID') } : await (async () => {
            const { error } = await database
                .from('user_roles')
                .update({ role: selectedRole, updated_at: new Date().toISOString() })
                .eq('user_id', userId);

            return { error };
        })();
    }, [userId, selectedRole]);

    const state = useAsync(async () => {
        return !userId ? { data: null, error: new Error('No user ID provided') } : await (async () => {
            // Get user role
            return await database
                .from('user_roles')
                .select('*')
                .eq('user_id', userId)
                .single();
        })();
    }, [userId, updateState]);

    const user = state.value?.data;


    const [deleteState, handleDelete] = useAsyncFn(async () => {
        return !userId ? { error: new Error('No user ID') } : await (async () => {
            const { error } = await database
                .from('user_roles')
                .delete()
                .eq('user_id', userId);

            return { error };
        })();
    }, [userId]);

    const formatDate = (dateString: string | null) => {
        return dateString ? new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : 'N/A';
    };

    const onUpdateRole = async () => {
        const result = await handleUpdateRole();
        result.error ?
            null :
            (setSuccessMessage('User role updated successfully!'), setTimeout(() => setSuccessMessage(''), 3000));
    };

    const onDeleteUser = async () => {
        const result = await handleDelete();
        result.error ?
            null :
            (setShowDeleteModal(false), router.push('/admin/users'));
    };

    return !userId ? <ErrorBanner msg="No user ID provided in URL" /> :
        //  :
        state.error ? <ErrorBanner msg={state.error.message} /> :
            !user ? <ErrorBanner msg="User not found" /> :
                (
                    <div>
                        {state.loading && <Loading message="Loading user details..." />}
                        <div className={styles.container}>

                            <div className={styles.header}>
                                <Button
                                    label="← Back to Users"
                                    onClick={() => router.push('/admin/users')}
                                    variant="secondary"
                                />
                            </div>

                            {successMessage && <SuccessBanner msg={successMessage} />}
                            {updateState.error && <ErrorBanner msg={updateState.error.message} />}
                            {deleteState.error && <ErrorBanner msg={deleteState.error.message} />}

                            <h1 className={styles.title}>User Details</h1>

                            <Card title="User Information">
                                <div className={styles.infoGrid}>
                                    <div className={styles.infoItem}>
                                        <span className={styles.label}>User ID:</span>
                                        <span className={styles.value}>{user.user_id}</span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <span className={styles.label}>Current Role:</span>
                                        <span className={`${styles.badge} ${styles[user.role]}`}>
                                            {user.role}
                                        </span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <span className={styles.label}>Created At:</span>
                                        <span className={styles.value}>{formatDate(user.created_at)}</span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <span className={styles.label}>Updated At:</span>
                                        <span className={styles.value}>{formatDate(user.updated_at)}</span>
                                    </div>
                                </div>
                            </Card>

                            <Card title="Change User Role">
                                <div className={styles.roleForm}>
                                    <div className={styles.selectGroup}>
                                        <label className={styles.selectLabel}>Select New Role</label>
                                        <select
                                            className={styles.select}
                                            value={selectedRole || user.role}
                                            onChange={(e) => setSelectedRole(e.target.value)}
                                        >
                                            <option value="admin">Admin</option>
                                            <option value="landlord">Landlord</option>
                                            <option value="tenant">Tenant</option>
                                        </select>
                                    </div>
                                    <Button
                                        label={updateState.loading ? 'Updating...' : 'Update Role'}
                                        onClick={onUpdateRole}
                                        variant="primary"
                                        disabled={updateState.loading || !selectedRole || selectedRole === user.role}
                                    />
                                </div>
                            </Card>

                            <Card title="Danger Zone">
                                <div className={styles.dangerZone}>
                                    <div className={styles.dangerText}>
                                        <h3 className={styles.dangerTitle}>Delete User</h3>
                                        <p className={styles.dangerDescription}>
                                            This will permanently delete the user and all associated data. This action cannot be undone.
                                        </p>
                                    </div>
                                    <Button
                                        label="Delete User"
                                        onClick={() => setShowDeleteModal(true)}
                                        variant="secondary"
                                    />
                                </div>
                            </Card>

                            <Modal
                                isOpen={showDeleteModal}
                                onClose={() => setShowDeleteModal(false)}
                                title="Confirm Delete"
                            >
                                <div className={styles.modalContent}>
                                    <p>Are you sure you want to delete this user?</p>
                                    <p className={styles.modalWarning}>This action cannot be undone.</p>
                                    <div className={styles.modalButtons}>
                                        <Button
                                            label="Cancel"
                                            onClick={() => setShowDeleteModal(false)}
                                            variant="secondary"
                                        />
                                        <Button
                                            label={deleteState.loading ? 'Deleting...' : 'Delete'}
                                            onClick={onDeleteUser}
                                            variant="primary"
                                            disabled={deleteState.loading}
                                        />
                                    </div>
                                </div>
                            </Modal>
                        </div>
                    </div>
                );
};

export default function UserDetailPage() {
    return (
        // <Suspense fallback={<Loading message="Loading..." />}>
        <UserDetailContent />
        // {/* </Suspense> */}
    );
}
