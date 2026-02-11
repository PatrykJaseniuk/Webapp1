'use client';

import Link from 'next/link';

interface EmptyStateProps {
    message: string;
    actionLabel?: string;
    actionHref?: string;
}

export const EmptyState = ({ message, actionLabel, actionHref }: EmptyStateProps) => (
    <div>
        <p>{message}</p>
        {actionLabel && actionHref && (
            <Link href={actionHref}>
                {actionLabel}
            </Link>
        )}
    </div>
);
