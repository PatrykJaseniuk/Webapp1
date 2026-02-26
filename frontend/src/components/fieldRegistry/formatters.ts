// ── Date Formatters ───────────────────────────────────────────────────

export const formatDate = (value: unknown): string =>
    typeof value === 'string' || value instanceof Date
        ? new Date(value as string | Date).toLocaleDateString('pl-PL')
        : '—';

export const formatDateTime = (value: unknown): string =>
    typeof value === 'string' || value instanceof Date
        ? new Date(value as string | Date).toLocaleString('pl-PL')
        : '—';

// ── Currency Formatter ─────────────────────────────────────────────────

export const formatCurrency = (value: unknown): string => {
    const num = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
    return isNaN(num)
        ? '—'
        : new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(num);
};