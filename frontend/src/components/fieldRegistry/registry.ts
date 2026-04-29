'use client';

import { inputText, inputDate, inputEmail, inputTextRequired, inputCurrency, inputNumber, inputTextarea, inputPropertyType, inputPropertyStatus, inputTenantStatus, inputLeaseStatus, inputTransactionType, inputTransactionStatus } from "./inputs";
import { outputText, outputDateTime, outputCurrency, outputNumber, outputDate, outputFileSize, outputTenantsRelation, outputLeaseAgreementsRelation, outputPropertiesRelation, outputTransactionsRelation, outputAttachmentsRelation, outputDaysCount, outputItemCount, outputPropertyType, outputPropertyStatus, outputTenantStatus, outputLeaseStatus, outputTransactionType, outputTransactionStatus, outputFileType } from "./outputs";
import { FieldConfig } from "./types";

// ── Global Field Registry ─────────────────────────────────────────────
// Defaults (applied by getFieldConfig): outputText, inputText, hidden: false, isSortable: true

export const FIELD_REGISTRY: Record<string, FieldConfig> = {
    // ── Common system fields ─────────────────────────────────────
    id: { label: 'ID', isHidden: true },
    created_at: { label: 'Utworzono', fieldOutput: outputDateTime, fieldInput: inputDate },
    updated_at: { label: 'Zaktualizowano', fieldOutput: outputDateTime, fieldInput: inputDate },
    created_by: { label: 'Utworzył', isHidden: true },

    // ── Common contact fields ────────────────────────────────────
    email: { label: 'Email', fieldInput: inputEmail },
    phone: { label: 'Telefon' },

    // ── Property fields ──────────────────────────────────────────
    name: { label: 'Nazwa', fieldInput: inputTextRequired },
    address: { label: 'Adres', fieldInput: inputTextRequired },
    property_type: { label: 'Typ nieruchomości', fieldOutput: outputPropertyType, fieldInput: inputPropertyType },
    monthly_rent: { label: 'Czynsz miesięczny', fieldOutput: outputCurrency, fieldInput: inputCurrency },
    deposit_amount: { label: 'Kaucja', fieldOutput: outputCurrency, fieldInput: inputCurrency },
    status: { label: 'Status', fieldOutput: outputPropertyStatus, fieldInput: inputPropertyStatus },
    size_sqm: { label: 'Powierzchnia (m²)', fieldOutput: outputNumber, fieldInput: inputNumber },
    bedrooms: { label: 'Sypialnie', fieldOutput: outputNumber, fieldInput: inputNumber },
    notes: { label: 'Notatki', fieldInput: inputTextarea },

    // ── Tenant fields ────────────────────────────────────────────
    first_name: { label: 'Imię', fieldInput: inputTextRequired },
    last_name: { label: 'Nazwisko', fieldInput: inputTextRequired },
    id_document_number: { label: 'Nr dokumentu' },
    emergency_contact_name: { label: 'Kontakt awaryjny' },
    emergency_contact_phone: { label: 'Tel. kontaktu awaryjnego' },
    user_id: { label: 'ID użytkownika', isHidden: true },
    tenant_status: { label: 'Status', fieldOutput: outputTenantStatus, fieldInput: inputTenantStatus },

    // ── Lease fields ─────────────────────────────────────────────
    tenant_id: { label: 'Najemca', isHidden: true },
    property_id: { label: 'Nieruchomość', isHidden: true },
    start_date: { label: 'Data rozpoczęcia', fieldOutput: outputDate, fieldInput: inputDate },
    end_date: { label: 'Data zakończenia', fieldOutput: outputDate, fieldInput: inputDate },
    lease_status: { label: 'Status', fieldOutput: outputLeaseStatus, fieldInput: inputLeaseStatus },

    // ── Transaction fields ───────────────────────────────────────
    lease_id: { label: 'Umowa', isHidden: true },
    type: { label: 'Typ', fieldOutput: outputTransactionType, fieldInput: inputTransactionType },
    description: { label: 'Opis' },
    amount: { label: 'Kwota', fieldOutput: outputCurrency, fieldInput: inputCurrency },
    due_date: { label: 'Termin', fieldOutput: outputDate, fieldInput: inputDate },
    transaction_status: { label: 'Status', fieldOutput: outputTransactionStatus, fieldInput: inputTransactionStatus },

    // ── Attachment fields ────────────────────────────────────────
    file_name: { label: 'Nazwa pliku' },
    file_url: { label: 'URL' },
    file_type: { label: 'Typ pliku', fieldOutput: outputFileType },
    file_size: { label: 'Rozmiar', fieldOutput: outputFileSize },
    related_to_id: { label: 'ID powiązania', isHidden: true },
    related_to_type: { label: 'Typ powiązania', isHidden: true },

    // ── User role fields ─────────────────────────────────────────
    role: { label: 'Rola' },

    // ── Relation fields (from nested Supabase queries) ───────────
    tenants: { label: 'Najemca', fieldOutput: outputTenantsRelation, isSortable: false },
    lease_agreements: { label: 'Umowy', fieldOutput: outputLeaseAgreementsRelation, isSortable: false },
    properties: { label: 'Nieruchomość', fieldOutput: outputPropertiesRelation, isSortable: false },
    transactions: { label: 'Transakcje', fieldOutput: outputTransactionsRelation, isSortable: false },
    attachments: { label: 'Załączniki', fieldOutput: outputAttachmentsRelation, isSortable: false },

    // ── View-specific fields (computed columns) ──────────────────
    tenant_name: { label: 'Najemca' },
    tenant_email: { label: 'Email najemcy' },
    tenant_phone: { label: 'Telefon najemcy' },
    property_name: { label: 'Nieruchomość' },
    property_address: { label: 'Adres' },
    days_active: { label: 'Dni aktywnych', fieldOutput: outputDaysCount },
    days_until_end: { label: 'Dni do końca', fieldOutput: outputDaysCount },
    total_income: { label: 'Przychody', fieldOutput: outputCurrency },
    total_expenses: { label: 'Wydatki', fieldOutput: outputCurrency },
    net_profit: { label: 'Zysk netto', fieldOutput: outputCurrency },
    current_tenant_name: { label: 'Obecny najemca' },
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

export const getFieldConfig = (
    fieldKey: string
): Required<FieldConfig> => {
    //registryConfig can be undefined

    const defaultConfig: Required<FieldConfig> = {
        label: fieldKey,
        fieldOutput: outputText,
        fieldInput: inputText,
        isHidden: false,
        isSortable: true
    }

    const isProperKey = Object.keys(FIELD_REGISTRY).find((regKey) => regKey == fieldKey) ? true : false

    const fieldConfig = isProperKey ?
        { ...defaultConfig, ...FIELD_REGISTRY[fieldKey] } :
        defaultConfig

    return fieldConfig
};