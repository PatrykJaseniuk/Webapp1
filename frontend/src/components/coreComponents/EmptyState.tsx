'use client';
import Link from 'next/link';
import styles from '@/components/styles/shared.module.css';

interface EmptyStateProps {
    message: string;
    actionLabel?: string;
    actionHref?: string;
}

export const EmptyState = ({ message, actionLabel, actionHref }: EmptyStateProps) => (
    <div className={styles.emptyState}>
        <p className={styles.emptyStateMessage}>{message}</p>
        {actionLabel && actionHref && (
            <Link href={actionHref} className={styles.emptyStateAction}>
                {actionLabel}
            </Link>
        )}
    </div>
);
