const currencyFormatter = new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

export const formatCurrency = (value: unknown): string =>
    typeof value === 'number'
        ? currencyFormatter.format(value)
        : typeof value === 'string' && !isNaN(Number(value))
            ? currencyFormatter.format(Number(value))
            : '—';
