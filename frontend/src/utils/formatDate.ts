export const formatDate = (value: unknown): string =>
    typeof value === 'string' || value instanceof Date
        ? new Date(value as string | Date).toLocaleDateString('pl-PL')
        : '—';

export const formatDateTime = (value: unknown): string =>
    typeof value === 'string' || value instanceof Date
        ? new Date(value as string | Date).toLocaleString('pl-PL')
        : '—';
