const longFormatter = new Intl.DateTimeFormat('pl-PL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
});

const shortFormatter = new Intl.DateTimeFormat('pl-PL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
});

export const formatDate = (isoDate: string): string =>
    longFormatter.format(new Date(isoDate));

export const formatDateShort = (isoDate: string): string =>
    shortFormatter.format(new Date(isoDate));
