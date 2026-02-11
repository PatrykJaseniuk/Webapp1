'use client';

import Link from 'next/link';

import styles from './EmptyState.module.css';

interface EmptyStateProps {
    message: string;
    actionLabel?: string;
    actionHref?: string;
}

export const EmptyState = ({ message, actionLabel, actionHref }: EmptyStateProps) => (
    <div className={styles.container}>
        <p className={styles.message}>{message}</p>
        {actionLabel && actionHref && (
            <Link className={styles.actionLink} href={actionHref}>
                {actionLabel}
            </Link>
        )}
    </div>
);
