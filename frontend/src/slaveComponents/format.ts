const DATE_FMT = new Intl.DateTimeFormat('pl-PL', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const PLN_FMT = new Intl.NumberFormat('pl-PL');

export const formatDate = (iso: string): string => DATE_FMT.format(new Date(iso));

export const formatPln = (amount: number): string => `${PLN_FMT.format(amount)} zł`;