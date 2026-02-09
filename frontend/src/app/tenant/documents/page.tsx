'use client';

import { useAsync } from 'react-use';
import { useAuth } from '@/contexts/AuthContext';
import { database } from '@/api/database';
import { Loading } from '@/components/Loading';
import { ErrorBanner } from '@/components/ErrorBanner';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import styles from './page.module.css';

interface Document {
    id: string;
    related_to_type: string;
    related_to_id: string;
    file_name: string;
    file_url: string;
    file_type: string | null;
    file_size: number | null;
    description: string | null;
    created_at: string | null;
}

interface TenantInfo {
    id: string;
}

export default function TenantDocuments() {
    const { user } = useAuth();

    const tenantState = useAsync(async () => {
        return !user?.id ? { data: null, error: new Error('No user') } : await (async () => {
            const { data, error } = await database
                .from('tenants')
                .select('id')
                .eq('user_id', user.id)
                .single();
            return { data, error };
        })();
    }, [user?.id]);

    const documentsState = useAsync(async () => {
        const tenantId = tenantState.value?.data?.id;
        return !tenantId ? { data: null, error: new Error('No tenant') } : await (async () => {
            // Get lease ID for the tenant
            const leaseResult = await database
                .from('lease_agreements')
                .select('id')
                .eq('tenant_id', tenantId)
                .eq('status', 'active')
                .single();

            if (leaseResult.error) {
                return { data: [], error: null };
            }

            const leaseId = leaseResult.data.id;

            // Get documents related to tenant or lease
            const { data, error } = await database
                .from('attachments')
                .select('*')
                .or(`related_to_type.eq.tenant,related_to_type.eq.lease`)
                .or(`related_to_id.eq.${tenantId},related_to_id.eq.${leaseId}`)
                .order('created_at', { ascending: false });

            return { data, error };
        })();
    }, [tenantState.value?.data?.id]);

    const tenant = tenantState.value?.data as TenantInfo;
    const documents = documentsState.value?.data ?? [];

    const formatFileSize = (bytes: number | null) => {
        if (!bytes) return 'Unknown';
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getFileIcon = (fileType: string | null) => {
        switch (fileType) {
            case 'image': return '🖼️';
            case 'video': return '🎥';
            case 'pdf': return '📄';
            case 'document': return '📝';
            default: return '📎';
        }
    };

    const handleDownload = (fileUrl: string, fileName: string) => {
        // In a real app, this would handle the download
        window.open(fileUrl, '_blank');
    };

    const documentsByType = documents.reduce((acc, doc) => {
        const type = doc.related_to_type;
        if (!acc[type]) acc[type] = [];
        acc[type].push(doc);
        return acc;
    }, {} as Record<string, Document[]>);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>My Documents</h1>
                <p className={styles.subtitle}>View and download your rental documents</p>
            </div>

            {tenantState.error && <ErrorBanner msg={tenantState.error.message} />}

            {Object.keys(documentsByType).length === 0 ? (
                <Card title="No Documents">
                    <p className={styles.emptyMessage}>
                        No documents have been uploaded for your account yet.
                    </p>
                </Card>
            ) : (
                Object.entries(documentsByType).map(([type, docs]) => (
                    <Card key={type} title={`${type.charAt(0).toUpperCase() + type.slice(1)} Documents`}>
                        <div className={styles.documentGrid}>
                            {docs.map((doc) => (
                                <div key={doc.id} className={styles.documentCard}>
                                    <div className={styles.documentIcon}>
                                        {getFileIcon(doc.file_type)}
                                    </div>
                                    <div className={styles.documentInfo}>
                                        <h4 className={styles.documentName}>{doc.file_name}</h4>
                                        {doc.description && (
                                            <p className={styles.documentDescription}>{doc.description}</p>
                                        )}
                                        <div className={styles.documentMeta}>
                                            <span className={styles.fileSize}>
                                                {formatFileSize(doc.file_size)}
                                            </span>
                                            <span className={styles.uploadDate}>
                                                {doc.created_at ? formatDate(doc.created_at) : 'Unknown'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={styles.documentActions}>
                                        <Button
                                            label="Download"
                                            onClick={() => handleDownload(doc.file_url, doc.file_name)}
                                            variant="primary"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                ))
            )}
        </div>
    );
}