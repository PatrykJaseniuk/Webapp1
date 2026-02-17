// Property labels
export const PROPERTY_STATUS_LABELS: Record<string, string> = {
    available: 'Wolna',
    occupied: 'Zajęta',
    inactive: 'Nieaktywna',
};

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
    apartment: 'Mieszkanie',
    house: 'Dom',
    commercial: 'Lokal użytkowy',
    room: 'Pokój',
};

// Lease labels
export const LEASE_STATUS_LABELS: Record<string, string> = {
    active: 'Aktywna',
    expired: 'Wygasła',
    terminated: 'Rozwiązana',
};

// Billing labels
export const BILLING_STATUS_LABELS: Record<string, string> = {
    pending: 'Oczekująca',
    paid: 'Opłacona',
    overdue: 'Przeterminowana',
};

export const ITEM_TYPE_LABELS: Record<string, string> = {
    rent: 'Czynsz',
    utility: 'Media',
    deposit: 'Kaucja',
    fee: 'Opłata',
    other: 'Inne',
};

// Meter labels
export const METER_TYPE_LABELS: Record<string, string> = {
    electricity: 'Prąd',
    water: 'Woda',
    gas: 'Gaz',
    heating: 'Ogrzewanie',
};

export const UNIT_LABELS: Record<string, string> = {
    kwh: 'kWh',
    m3: 'm³',
};

// Expense labels
export const EXPENSE_TYPE_LABELS: Record<string, string> = {
    maintenance: 'Naprawy',
    tax: 'Podatki',
    insurance: 'Ubezpieczenie',
    renovation: 'Remont',
    other: 'Inne',
};

// Payment labels
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
    cash: 'Gotówka',
    bank_transfer: 'Przelew',
    card: 'Karta',
    other: 'Inne',
};

// File labels
export const FILE_TYPE_LABELS: Record<string, string> = {
    image: 'Obraz',
    video: 'Wideo',
    pdf: 'PDF',
    document: 'Dokument',
    other: 'Inny',
};

// Tenant labels
export const TENANT_STATUS_LABELS: Record<string, string> = {
    active: 'Aktywny',
    past: 'Były',
    applicant: 'Kandydat',
};

// Transaction labels
export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
    rent: 'Czynsz',
    utility: 'Media',
    expense: 'Wydatek',
    payment: 'Platnosc',
    withdraw: 'Wyplata',
    fee: 'Oplata',
    other: 'Inne',
};

export const TRANSACTION_STATUS_LABELS: Record<string, string> = {
    pending: 'Oczekujaca',
    paid: 'Oplacona',
    overdue: 'Przeterminowana',
};
