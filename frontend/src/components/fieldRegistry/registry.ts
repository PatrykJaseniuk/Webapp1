'use client';
import type { FieldConfig } from './types';
import {
    outputText,
    outputNumber,
    outputCurrency,
    outputDate,
    outputDateTime,
    outputDaysCount,
    outputItemCount,
    outputFileSize,
    outputPropertyType,
    outputPropertyStatus,
    outputTenantStatus,
    outputLeaseStatus,
    outputTransactionType,
    outputTransactionStatus,
    outputFileType,
    outputTenantsRelation,
    outputLeaseAgreementsRelation,
    outputPropertiesRelation,
    outputTransactionsRelation,
    outputAttachmentsRelation,
} from './outputs';
import {
    inputText,
    inputTextRequired,
    inputEmail,
    inputTextarea,
    inputNumber,
    inputCurrency,
    inputDate,
    inputBoolean,
    inputPropertyType,
    inputPropertyStatus,
    inputTenantStatus,
    inputLeaseStatus,
    inputTransactionType,
    inputTransactionStatus,
} from './inputs';

// ── Global Field Registry ─────────────────────────────────────────────

export const FIELD_REGISTRY: Record<string, FieldConfig<unknown>> = {
    // ── Common system fields ─────────────────────────────────────
    id: { label: 'ID', hidden: true },
    created_at: { label: 'Utworzono', fieldOutput: outputDateTime },
    updated_at: { label: 'Zaktualizowano', fieldOutput: outputDateTime },
    created_by: { label: 'Utworzył', hidden: true },

    // ── Common contact fields ────────────────────────────────────
    email: { label: 'Email', fieldOutput: outputText, fieldInput: inputEmail },
    phone: { label: 'Telefon', fieldOutput: outputText, fieldInput: inputText },

    // ── Property fields ──────────────────────────────────────────
    name: { label: 'Nazwa', fieldOutput: outputText, fieldInput: inputTextRequired },
    address: { label: 'Adres', fieldOutput: outputText, fieldInput: inputTextRequired },
    property_type: {
        label: 'Typ nieruchomości',
        fieldOutput: outputPropertyType,
        fieldInput: inputPropertyType,
    },
    monthly_rent: {
        label: 'Czynsz miesięczny',
        fieldOutput: outputCurrency,
        fieldInput: inputCurrency,
    },
    deposit_amount: {
        label: 'Kaucja',
        fieldOutput: outputCurrency,
        fieldInput: inputCurrency,
    },
    status: {
        label: 'Status',
        fieldOutput: outputPropertyStatus,
        fieldInput: inputPropertyStatus,
    },
    size_sqm: { label: 'Powierzchnia (m²)', fieldOutput: outputNumber, fieldInput: inputNumber },
    bedrooms: { label: 'Sypialnie', fieldOutput: outputNumber, fieldInput: inputNumber },
    notes: { label: 'Notatki', fieldOutput: outputText, fieldInput: inputTextarea },

    // ── Tenant fields ────────────────────────────────────────────
    first_name: { label: 'Imię', fieldOutput: outputText, fieldInput: inputTextRequired },
    last_name: { label: 'Nazwisko', fieldOutput: outputText, fieldInput: inputTextRequired },
    id_document_number: { label: 'Nr dokumentu', fieldOutput: outputText, fieldInput: inputText },
    emergency_contact_name: { label: 'Kontakt awaryjny', fieldOutput: outputText, fieldInput: inputText },
    emergency_contact_phone: { label: 'Tel. kontaktu awaryjnego', fieldOutput: outputText, fieldInput: inputText },
    user_id: { label: 'ID użytkownika', hidden: true },
    tenant_status: {
        label: 'Status',
        fieldOutput: outputTenantStatus,
        fieldInput: inputTenantStatus,
    },

    // ── Lease fields ─────────────────────────────────────────────
    tenant_id: { label: 'Najemca', hidden: true },
    property_id: { label: 'Nieruchomość', fieldOutput: outputText, hidden: true },
    start_date: { label: 'Data rozpoczęcia', fieldOutput: outputDate, fieldInput: inputDate },
    end_date: { label: 'Data zakończenia', fieldOutput: outputDate, fieldInput: inputDate },
    lease_status: {
        label: 'Status',
        fieldOutput: outputLeaseStatus,
        fieldInput: inputLeaseStatus,
    },

    // ── Transaction fields ───────────────────────────────────────
    lease_id: { label: 'Umowa', hidden: true },
    type: {
        label: 'Typ',
        fieldOutput: outputTransactionType,
        fieldInput: inputTransactionType,
    },
    description: { label: 'Opis', fieldOutput: outputText, fieldInput: inputText },
    amount: { label: 'Kwota', fieldOutput: outputCurrency, fieldInput: inputCurrency },
    due_date: { label: 'Termin', fieldOutput: outputDate, fieldInput: inputDate },
    transaction_status: {
        label: 'Status',
        fieldOutput: outputTransactionStatus,
        fieldInput: inputTransactionStatus,
    },

    // ── Attachment fields ────────────────────────────────────────
    file_name: { label: 'Nazwa pliku', fieldOutput: outputText },
    file_url: { label: 'URL', fieldOutput: outputText },
    file_type: { label: 'Typ pliku', fieldOutput: outputFileType },
    file_size: { label: 'Rozmiar', fieldOutput: outputFileSize },
    related_to_id: { label: 'ID powiązania', hidden: true },
    related_to_type: { label: 'Typ powiązania', hidden: true },

    // ── User role fields ─────────────────────────────────────────
    role: { label: 'Rola', fieldOutput: outputText },

    // ── Relation fields (from nested Supabase queries) ───────────
    // Note: Relation fields are not sortable - they contain nested objects/arrays
    tenants: {
        label: 'Najemca',
        fieldOutput: outputTenantsRelation,
        sortable: false,
    },
    lease_agreements: {
        label: 'Umowy',
        fieldOutput: outputLeaseAgreementsRelation,
        sortable: false,
    },
    properties: {
        label: 'Nieruchomość',
        fieldOutput: outputPropertiesRelation,
        sortable: false,
    },
    transactions: {
        label: 'Transakcje',
        fieldOutput: outputTransactionsRelation,
        sortable: false,
    },
    attachments: {
        label: 'Załączniki',
        fieldOutput: outputAttachmentsRelation,
        sortable: false,
    },

    // ── View-specific fields (computed columns) ──────────────────
    tenant_name: { label: 'Najemca', fieldOutput: outputText },
    tenant_email: { label: 'Email najemcy', fieldOutput: outputText },
    tenant_phone: { label: 'Telefon najemcy', fieldOutput: outputText },
    property_name: { label: 'Nieruchomość', fieldOutput: outputText },
    property_address: { label: 'Adres', fieldOutput: outputText },
    days_active: { label: 'Dni aktywnych', fieldOutput: outputDaysCount },
    days_until_end: { label: 'Dni do końca', fieldOutput: outputDaysCount },
    total_income: { label: 'Przychody', fieldOutput: outputCurrency },
    total_expenses: { label: 'Wydatki', fieldOutput: outputCurrency },
    net_profit: { label: 'Zysk netto', fieldOutput: outputCurrency },
    current_tenant_name: { label: 'Obecny najemca', fieldOutput: outputText },
    current_rent: { label: 'Obecny czynsz', fieldOutput: outputCurrency },
    lease_start: { label: 'Początek najmu', fieldOutput: outputDate },
    lease_end: { label: 'Koniec najmu', fieldOutput: outputDate },
    unpaid_items_count: { label: 'Nieopłacone', fieldOutput: outputItemCount },
    total_unpaid_amount: { label: 'Kwota nieopłacona', fieldOutput: outputCurrency },
    overdue_items_count: { label: 'Zaległe', fieldOutput: outputItemCount },
    total_overdue_amount: { label: 'Kwota zaległa', fieldOutput: outputCurrency },
    earliest_due_date: { label: 'Najwcześniejszy termin', fieldOutput: outputDate },
} as const;

// ── Resolver ────────────────────────────────────────────────────────

/**
 * Resolve field configuration with optional overrides.
 * Merges global registry config with usage-specific overrides.
 */
export const resolveFieldConfig = (
    fieldKey: string,
    override?: Partial<FieldConfig>,
): FieldConfig => ({
    ...(FIELD_REGISTRY[fieldKey] ?? {}),
    ...(override ?? {}),
});