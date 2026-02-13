'use client';

import type { Database } from '@/api/database.types';
import { FILE_TYPE_LABELS } from '@/constants/labels';
import styles from './Tables.module.css';

type Attachment = Database['public']['Tables']['attachments']['Row'];

interface AttachmentsGridProps {
    data: Attachment[];
    onRowClick?: (id: string) => void;
}

const getFileIcon = (fileType: string | null) =>
    fileType === 'image' ? 'Bild' :
        fileType === 'pdf' ? 'Dokument' :
            fileType === 'video' ? 'Wideo' :
                fileType === 'document' ? 'Dokument' : 'Plik';

export const AttachmentsGrid = ({ data, onRowClick }: AttachmentsGridProps) => (
    <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Zalaczniki ({data.length})</h2>

        {data.length === 0
            ? <div className={styles.emptyState}>Brak zalacznikow dla tej nieruchomosci</div>
            : (
                <div className={styles.grid}>
                    {data.map(attachment => (
                        <div
                            key={attachment.id}
                            className={styles.card}
                            onClick={() => onRowClick?.(attachment.id)}
                        >
                            <div className={styles.icon}>
                                {getFileIcon(attachment.file_type)}
                            </div>
                            <div className={styles.info}>
                                <span className={styles.name}>{attachment.file_name}</span>
                                <span className={styles.type}>
                                    {FILE_TYPE_LABELS[attachment.file_type ?? ''] ?? attachment.file_type}
                                    {attachment.file_size && ` - ${(attachment.file_size / 1024).toFixed(1)} KB`}
                                </span>
                                {attachment.description && (
                                    <span className={styles.description}>{attachment.description}</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )
        }
    </div>
);