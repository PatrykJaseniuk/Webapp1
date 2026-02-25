'use client';
import React from 'react';
import { formatDate, formatDateTime } from '@/utils/formatDate';
import { formatCurrency } from '@/utils/formatCurrency';

// ── Types ──────────────────────────────────────────────────────────

/** Cell renderer function type */
export type CellRenderer<TValue = unknown> = (
    value: TValue,
    row: Record<string, unknown>
) => React.ReactNode;

/** Input renderer function type */
export type InputRenderer = (
    value: unknown,
    onChange: (value: unknown) => void
) => React.ReactNode;

/** Column configuration */
export interface ColumnConfig<TValue = unknown> {
    /** Label renderer function - returns Polish display label */
    labelRender?: () => string;
    /** Custom cell renderer for display */
    cellRender?: CellRenderer<TValue>;
    /** Input component for editing (undefined = readonly) */
    inputRender?: InputRenderer;
    /** Hide from tables/forms */
    hidden?: boolean;
}

/** Generic column registry type */
export type ColumnRegistry<TRow = Record<string, unknown>> = {
    [K in keyof TRow]?: ColumnConfig<TRow[K]>;
};

// ── Enum Labels ─────────────────────────────────────────────────────

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

export const TENANT_STATUS_LABELS: Record<string, string> = {
    active: 'Aktywny',
    inactive: 'Nieaktywny',
    pending: 'Oczekujący',
} as const;

export const LEASE_STATUS_LABELS: Record<string, string> = {
    active: 'Aktywna',
    expired: 'Wygasła',
    terminated: 'Rozwiązana',
    draft: 'Szkic',
} as const;

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

export const FILE_TYPE_LABELS: Record<string, string> = {
    pdf: 'PDF',
    image: 'Obraz',
    document: 'Dokument',
    spreadsheet: 'Arkusz',
    other: 'Inny',
} as const;

// ── Cell Renderers ───────────────────────────────────────────────────

/** Null value placeholder */
const renderNull = (): React.ReactNode => <span className="cellNull">—</span>;

/** Currency cell with styling - negative values shown in red */
const renderCurrency = (value: unknown): React.ReactNode => {
    const numValue = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
    const isNegative = !isNaN(numValue) && numValue < 0;
    return value === null || value === undefined
        ? renderNull()
        : <span className={`cellCurrency${isNegative ? ' cellCurrencyNegative' : ''}`}>{formatCurrency(value)}</span>;
};

/** Date cell with formatting */
const renderDate = (value: unknown): React.ReactNode =>
    value === null || value === undefined
        ? renderNull()
        : <span className="cellDate">{formatDate(value)}</span>;

/** DateTime cell with formatting */
const renderDateTime = (value: unknown): React.ReactNode =>
    value === null || value === undefined
        ? renderNull()
        : <span className="cellDateTime">{formatDateTime(value)}</span>;

/** Boolean cell with check/cross icons */
const renderBoolean = (value: unknown): React.ReactNode =>
    value === null || value === undefined
        ? renderNull()
        : value === true
            ? <span className="cellBoolean cellBooleanTrue">✓ Tak</span>
            : <span className="cellBoolean cellBooleanFalse">✗ Nie</span>;

/** Number cell with sign-based colors */
const renderNumber = (value: unknown): React.ReactNode => {
    const numValue = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
    const colorClass = isNaN(numValue)
        ? ''
        : numValue > 0
            ? ' cellNumberPositive'
            : numValue < 0
                ? ' cellNumberNegative'
                : ' cellNumberZero';
    return value === null || value === undefined
        ? renderNull()
        : <span className={`cellNumber${colorClass}`}>{String(value)}</span>;
};

/** Days count cell with urgency colors (for days_until_end, days_active) */
const renderDaysCount = (value: unknown): React.ReactNode => {
    const numValue = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
    const colorClass = isNaN(numValue)
        ? ''
        : numValue < 0
            ? ' cellDaysOverdue'
            : numValue <= 7
                ? ' cellDaysWarning'
                : numValue <= 30
                    ? ' cellDaysNormal'
                    : ' cellDaysSafe';
    return value === null || value === undefined
        ? renderNull()
        : <span className={`cellNumber${colorClass}`}>{String(value)}</span>;
};

/** Item count cell with severity colors (for unpaid_items_count, overdue_items_count) */
const renderItemCount = (value: unknown): React.ReactNode => {
    const numValue = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
    const colorClass = isNaN(numValue)
        ? ''
        : numValue === 0
            ? ' cellCountGood'
            : numValue <= 3
                ? ' cellCountWarning'
                : ' cellCountCritical';
    return value === null || value === undefined
        ? renderNull()
        : <span className={`cellNumber${colorClass}`}>{String(value)}</span>;
};

/** Text cell */
const renderText = (value: unknown): React.ReactNode =>
    value === null || value === undefined
        ? renderNull()
        : <span className="cellText">{String(value)}</span>;

/** Creates enum label renderer */
const createEnumRenderer = (labels: Record<string, string>) => (value: unknown): React.ReactNode =>
    value === null || value === undefined
        ? renderNull()
        : <span className="cellEnum">{labels[value as string] ?? String(value)}</span>;

/** Creates status badge renderer with color coding */
const createStatusRenderer = (labels: Record<string, string>, statusColors: Record<string, string>) => 
    (value: unknown): React.ReactNode =>
        value === null || value === undefined
            ? renderNull()
            : <span className={`cellStatus cellStatus--${statusColors[value as string] ?? 'default'}`}>
                {labels[value as string] ?? String(value)}
              </span>;

// Status color mappings for badges
const PROPERTY_STATUS_COLORS: Record<string, string> = {
    available: 'success',
    rented: 'info',
    maintenance: 'warning',
    inactive: 'muted',
};

const TENANT_STATUS_COLORS: Record<string, string> = {
    active: 'success',
    inactive: 'muted',
    pending: 'warning',
};

const LEASE_STATUS_COLORS: Record<string, string> = {
    active: 'success',
    expired: 'muted',
    terminated: 'error',
    draft: 'warning',
};

const TRANSACTION_STATUS_COLORS: Record<string, string> = {
    pending: 'warning',
    paid: 'success',
    overdue: 'error',
    cancelled: 'muted',
};

// Pre-built status renderers
const renderPropertyType = createEnumRenderer(PROPERTY_TYPE_LABELS);
const renderPropertyStatus = createStatusRenderer(PROPERTY_STATUS_LABELS, PROPERTY_STATUS_COLORS);
const renderTenantStatus = createStatusRenderer(TENANT_STATUS_LABELS, TENANT_STATUS_COLORS);
const renderLeaseStatus = createStatusRenderer(LEASE_STATUS_LABELS, LEASE_STATUS_COLORS);
const renderTransactionType = createEnumRenderer(TRANSACTION_TYPE_LABELS);
const renderTransactionStatus = createStatusRenderer(TRANSACTION_STATUS_LABELS, TRANSACTION_STATUS_COLORS);
const renderFileType = createEnumRenderer(FILE_TYPE_LABELS);

/** File size formatter */
const renderFileSize = (value: unknown): React.ReactNode => {
    const num = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
    return isNaN(num) || num === null
        ? renderNull()
        : <span className="cellFileSize">
            {num < 1024
                ? `${num} B`
                : num < 1024 * 1024
                    ? `${(num / 1024).toFixed(1)} KB`
                    : `${(num / (1024 * 1024)).toFixed(1)} MB`}
          </span>;
};

// ── Input Renderers ───────────────────────────────────────────────────

/** Text input */
const inputText: InputRenderer = (value, onChange) => (
    <input
        type="text"
        className="inputText"
        value={(value as string) ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        placeholder="Wprowadź wartość"
    />
);

/** Required text input with validation */
const inputTextRequired: InputRenderer = (value, onChange) => {
    const hasValue = value !== null && value !== undefined && String(value).trim() !== '';
    return (
        <div className="inputWrapper">
            <input
                type="text"
                className={`inputText ${!hasValue ? 'inputError' : ''}`}
                value={(value as string) ?? ''}
                onChange={(e) => onChange(e.target.value || null)}
                placeholder="Wymagane"
            />
            {!hasValue && <span className="inputErrorMsg">Pole wymagane</span>}
        </div>
    );
};

/** Email input with validation */
const inputEmail: InputRenderer = (value, onChange) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const strValue = (value as string) ?? '';
    const isValid = strValue === '' || emailRegex.test(strValue);
    return (
        <div className="inputWrapper">
            <input
                type="email"
                className={`inputText ${!isValid ? 'inputError' : ''}`}
                value={strValue}
                onChange={(e) => onChange(e.target.value || null)}
                placeholder="email@przyklad.pl"
            />
            {!isValid && <span className="inputErrorMsg">Nieprawidłowy adres email</span>}
        </div>
    );
};

/** Number input */
const inputNumber: InputRenderer = (value, onChange) => (
    <input
        type="number"
        className="inputNumber"
        value={(value as number) ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        placeholder="0"
    />
);

/** Currency input with suffix */
const inputCurrency: InputRenderer = (value, onChange) => (
    <div className="inputCurrencyWrapper">
        <input
            type="number"
            className="inputCurrency"
            step="0.01"
            min="0"
            value={(value as number) ?? ''}
            onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
            placeholder="0.00"
        />
        <span className="inputCurrencySuffix">zł</span>
    </div>
);

/** Date input */
const inputDate: InputRenderer = (value, onChange) => (
    <input
        type="date"
        className="inputDate"
        value={(value as string) ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
    />
);

/** DateTime input */
const inputDateTime: InputRenderer = (value, onChange) => (
    <input
        type="datetime-local"
        className="inputDateTime"
        value={(value as string) ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
    />
);

/** Textarea input */
const inputTextarea: InputRenderer = (value, onChange) => (
    <textarea
        className="inputTextarea"
        value={(value as string) ?? ''}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder="Wprowadź tekst..."
    />
);

/** Creates select input from options */
const inputSelect = (options: Record<string, string>, placeholder = '— Wybierz —'): InputRenderer =>
    (value, onChange) => (
        <select
            className="inputSelect"
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value || null)}
        >
            <option value="">{placeholder}</option>
            {Object.entries(options).map(([k, v]) => (
                <option key={k} value={k}>
                    {v}
                </option>
            ))}
        </select>
    );

/** Boolean checkbox input */
const inputBoolean: InputRenderer = (value, onChange) => (
    <label className="inputCheckboxLabel">
        <input
            type="checkbox"
            className="inputCheckbox"
            checked={value === true}
            onChange={(e) => onChange(e.target.checked)}
        />
        <span className="inputCheckboxText">{value === true ? 'Tak' : 'Nie'}</span>
    </label>
);

// Pre-built select inputs
const inputPropertyType = inputSelect(PROPERTY_TYPE_LABELS, '— Wybierz typ —');
const inputPropertyStatus = inputSelect(PROPERTY_STATUS_LABELS, '— Wybierz status —');
const inputTenantStatus = inputSelect(TENANT_STATUS_LABELS, '— Wybierz status —');
const inputLeaseStatus = inputSelect(LEASE_STATUS_LABELS, '— Wybierz status —');
const inputTransactionType = inputSelect(TRANSACTION_TYPE_LABELS, '— Wybierz typ —');
const inputTransactionStatus = inputSelect(TRANSACTION_STATUS_LABELS, '— Wybierz status —');

// ── Global Registry ───────────────────────────────────────────────────

export const COLUMN_REGISTRY: Record<string, ColumnConfig<unknown>> = {
    // ── Common system fields ─────────────────────────────────────
    id: { labelRender: () => 'ID', hidden: true },
    created_at: { labelRender: () => 'Utworzono', cellRender: renderDateTime },
    updated_at: { labelRender: () => 'Zaktualizowano', cellRender: renderDateTime },
    created_by: { labelRender: () => 'Utworzył', hidden: true },

    // ── Common contact fields ────────────────────────────────────
    email: { labelRender: () => 'Email', cellRender: renderText, inputRender: inputEmail },
    phone: { labelRender: () => 'Telefon', cellRender: renderText, inputRender: inputText },

    // ── Property fields ──────────────────────────────────────────
    name: { labelRender: () => 'Nazwa', cellRender: renderText, inputRender: inputTextRequired },
    address: { labelRender: () => 'Adres', cellRender: renderText, inputRender: inputTextRequired },
    property_type: {
        labelRender: () => 'Typ nieruchomości',
        cellRender: renderPropertyType,
        inputRender: inputPropertyType,
    },
    monthly_rent: {
        labelRender: () => 'Czynsz miesięczny',
        cellRender: renderCurrency,
        inputRender: inputCurrency,
    },
    deposit_amount: {
        labelRender: () => 'Kaucja',
        cellRender: renderCurrency,
        inputRender: inputCurrency,
    },
    status: {
        labelRender: () => 'Status',
        cellRender: renderPropertyStatus,
        inputRender: inputPropertyStatus,
    },
    size_sqm: { labelRender: () => 'Powierzchnia (m²)', cellRender: renderNumber, inputRender: inputNumber },
    bedrooms: { labelRender: () => 'Sypialnie', cellRender: renderNumber, inputRender: inputNumber },
    notes: { labelRender: () => 'Notatki', cellRender: renderText, inputRender: inputTextarea },

    // ── Tenant fields ────────────────────────────────────────────
    first_name: { labelRender: () => 'Imię', cellRender: renderText, inputRender: inputTextRequired },
    last_name: { labelRender: () => 'Nazwisko', cellRender: renderText, inputRender: inputTextRequired },
    id_document_number: { labelRender: () => 'Nr dokumentu', cellRender: renderText, inputRender: inputText },
    emergency_contact_name: { labelRender: () => 'Kontakt awaryjny', cellRender: renderText, inputRender: inputText },
    emergency_contact_phone: { labelRender: () => 'Tel. kontaktu awaryjnego', cellRender: renderText, inputRender: inputText },
    user_id: { labelRender: () => 'ID użytkownika', hidden: true },
    tenant_status: {
        labelRender: () => 'Status',
        cellRender: renderTenantStatus,
        inputRender: inputTenantStatus,
    },

    // ── Lease fields ─────────────────────────────────────────────
    tenant_id: { labelRender: () => 'Najemca', hidden: true },
    property_id: { labelRender: () => 'Nieruchomość', cellRender: renderText },
    start_date: { labelRender: () => 'Data rozpoczęcia', cellRender: renderDate, inputRender: inputDate },
    end_date: { labelRender: () => 'Data zakończenia', cellRender: renderDate, inputRender: inputDate },
    lease_status: {
        labelRender: () => 'Status',
        cellRender: renderLeaseStatus,
        inputRender: inputLeaseStatus,
    },

    // ── Transaction fields ───────────────────────────────────────
    lease_id: { labelRender: () => 'Umowa', hidden: true },
    type: {
        labelRender: () => 'Typ',
        cellRender: renderTransactionType,
        inputRender: inputTransactionType,
    },
    description: { labelRender: () => 'Opis', cellRender: renderText, inputRender: inputText },
    amount: { labelRender: () => 'Kwota', cellRender: renderCurrency, inputRender: inputCurrency },
    due_date: { labelRender: () => 'Termin', cellRender: renderDate, inputRender: inputDate },
    transaction_status: {
        labelRender: () => 'Status',
        cellRender: renderTransactionStatus,
        inputRender: inputTransactionStatus,
    },

    // ── Attachment fields ────────────────────────────────────────
    file_name: { labelRender: () => 'Nazwa pliku', cellRender: renderText },
    file_url: { labelRender: () => 'URL', cellRender: renderText },
    file_type: { labelRender: () => 'Typ pliku', cellRender: renderFileType },
    file_size: { labelRender: () => 'Rozmiar', cellRender: renderFileSize },
    related_to_id: { labelRender: () => 'ID powiązania', hidden: true },
    related_to_type: { labelRender: () => 'Typ powiązania', hidden: true },

    // ── User role fields ─────────────────────────────────────────
    role: { labelRender: () => 'Rola', cellRender: renderText },

    // ── View-specific fields (computed columns) ──────────────────
    tenant_name: { labelRender: () => 'Najemca', cellRender: renderText },
    tenant_email: { labelRender: () => 'Email najemcy', cellRender: renderText },
    tenant_phone: { labelRender: () => 'Telefon najemcy', cellRender: renderText },
    property_name: { labelRender: () => 'Nieruchomość', cellRender: renderText },
    property_address: { labelRender: () => 'Adres', cellRender: renderText },
    days_active: { labelRender: () => 'Dni aktywnych', cellRender: renderDaysCount },
    days_until_end: { labelRender: () => 'Dni do końca', cellRender: renderDaysCount },
    total_income: { labelRender: () => 'Przychody', cellRender: renderCurrency },
    total_expenses: { labelRender: () => 'Wydatki', cellRender: renderCurrency },
    net_profit: { labelRender: () => 'Zysk netto', cellRender: renderCurrency },
    current_tenant_name: { labelRender: () => 'Obecny najemca', cellRender: renderText },
    current_rent: { labelRender: () => 'Obecny czynsz', cellRender: renderCurrency },
    lease_start: { labelRender: () => 'Początek najmu', cellRender: renderDate },
    lease_end: { labelRender: () => 'Koniec najmu', cellRender: renderDate },
    unpaid_items_count: { labelRender: () => 'Nieopłacone', cellRender: renderItemCount },
    total_unpaid_amount: { labelRender: () => 'Kwota nieopłacona', cellRender: renderCurrency },
    overdue_items_count: { labelRender: () => 'Zaległe', cellRender: renderItemCount },
    total_overdue_amount: { labelRender: () => 'Kwota zaległa', cellRender: renderCurrency },
    earliest_due_date: { labelRender: () => 'Najwcześniejszy termin', cellRender: renderDate },
} as const;

// ── Resolver ────────────────────────────────────────────────────────

/**
 * Resolve column configuration with optional overrides.
 * Merges global registry config with usage-specific overrides.
 */
export const resolveColumnConfig = (
    columnKey: string,
    override?: Partial<ColumnConfig>,
): ColumnConfig => ({
    ...(COLUMN_REGISTRY[columnKey] ?? {}),
    ...(override ?? {}),
});