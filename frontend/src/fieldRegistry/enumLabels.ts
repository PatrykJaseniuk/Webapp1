// ── Property Enums ────────────────────────────────────────────────────

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
    apartment: 'Mieszkanie',
    house: 'Dom',
    commercial: 'Lokal usługowy',
    garage: 'Garaż',
    land: 'Działka',
    other: 'Inne',
} as const;

export const PROPERTY_STATUS_LABELS: Record<string, string> = {
    available: 'Dostępna',
    rented: 'Wynajęta',
    maintenance: 'W remoncie',
    inactive: 'Nieaktywna',
} as const;

// ── Tenant Enums ──────────────────────────────────────────────────────

export const TENANT_STATUS_LABELS: Record<string, string> = {
    active: 'Aktywny',
    inactive: 'Nieaktywny',
    pending: 'Oczekujący',
} as const;

// ── Lease Enums ───────────────────────────────────────────────────────

export const LEASE_STATUS_LABELS: Record<string, string> = {
    active: 'Aktywna',
    expired: 'Wygasła',
    terminated: 'Rozwiązana',
    draft: 'Szkic',
} as const;

// ── Transaction Enums ─────────────────────────────────────────────────

export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
    rent: 'Czynsz',
    deposit: 'Kaucja',
    utility: 'Media',
    maintenance: 'Konserwacja',
    other: 'Inne',
} as const;

export const TRANSACTION_STATUS_LABELS: Record<string, string> = {
    pending: 'Oczekująca',
    paid: 'Opłacona',
    overdue: 'Zaległa',
    cancelled: 'Anulowana',
} as const;

// ── Attachment Enums ──────────────────────────────────────────────────

export const FILE_TYPE_LABELS: Record<string, string> = {
    pdf: 'PDF',
    image: 'Obraz',
    document: 'Dokument',
    spreadsheet: 'Arkusz',
    other: 'Inny',
} as const;