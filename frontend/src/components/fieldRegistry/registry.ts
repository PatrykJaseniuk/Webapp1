'use client';

import { inputText, inputDate, inputDateTime, inputEmail, inputTextRequired, inputCurrency, inputNumber, inputTextarea, inputPropertyType, inputPropertyStatus, inputTenantStatus, inputLeaseStatus, inputTransactionType, inputTransactionStatus } from "./inputs";
import { outputText, outputDateTime, outputCurrency, outputNumber, outputDate, outputFileSize, outputTenantsRelation, outputLeaseAgreementsRelation, outputPropertiesRelation, outputTransactionsRelation, outputAttachmentsRelation, outputDaysCount, outputItemCount, outputPropertyType, outputPropertyStatus, outputTenantStatus, outputLeaseStatus, outputTransactionType, outputTransactionStatus, outputFileType } from "./outputs";
import type { FieldConfig } from "./types";

// ── Global Field Registry ─────────────────────────────────────────────
// Defaults (applied by getFieldConfig): inputText, hidden: false, isSortable: true

export const FIELD_REGISTRY: Record<string, FieldConfig> = {
    // ── Common system fields ─────────────────────────────────────
    id: { label: 'ID', isHidden: true },
    created_at: { label: 'Utworzono', fieldRenderer: inputDateTime },
    updated_at: { label: 'Zaktualizowano', fieldRenderer: inputDateTime },
    created_by: { label: 'Utworzył', isHidden: true },

    // ── Common contact fields ────────────────────────────────────
    email: { label: 'Email', fieldRenderer: inputEmail },
    phone: { label: 'Telefon' },

    // ── Property fields ──────────────────────────────────────────
    name: { label: 'Nazwa', fieldRenderer: inputTextRequired },
    address: { label: 'Adres', fieldRenderer: inputTextRequired },
    property_type: { label: 'Typ nieruchomości', fieldRenderer: inputPropertyType },
    monthly_rent: { label: 'Czynsz miesięczny', fieldRenderer: inputCurrency },
    deposit_amount: { label: 'Kaucja', fieldRenderer: inputCurrency },
    property_status: { label: 'Status', fieldRenderer: inputPropertyStatus },
    size_sqm: { label: 'Powierzchnia (m²)', fieldRenderer: inputNumber },
    bedrooms: { label: 'Sypialnie', fieldRenderer: inputNumber },
    notes: { label: 'Notatki', fieldRenderer: inputTextarea },

    // ── Tenant fields ────────────────────────────────────────────
    first_name: { label: 'Imię', fieldRenderer: inputTextRequired },
    last_name: { label: 'Nazwisko', fieldRenderer: inputTextRequired },
    id_document_number: { label: 'Nr dokumentu' },
    emergency_contact_name: { label: 'Kontakt awaryjny' },
    emergency_contact_phone: { label: 'Tel. kontaktu awaryjnego' },
    user_id: { label: 'ID użytkownika', isHidden: true },
    tenant_status: { label: 'Status', fieldRenderer: inputTenantStatus },

    // ── Lease fields ─────────────────────────────────────────────
    tenant_id: { label: 'Najemca', isHidden: true },
    property_id: { label: 'Nieruchomość', isHidden: true },
    start_date: { label: 'Data rozpoczęcia', fieldRenderer: inputDate },
    end_date: { label: 'Data zakończenia', fieldRenderer: inputDate },
    lease_status: { label: 'Status', fieldRenderer: inputLeaseStatus },

    // ── Transaction fields ───────────────────────────────────────
    lease_id: { label: 'Umowa', isHidden: true },
    type: { label: 'Typ', fieldRenderer: inputTransactionType },
    description: { label: 'Opis' },
    amount: { label: 'Kwota', fieldRenderer: inputCurrency },
    due_date: { label: 'Termin', fieldRenderer: inputDate },
    transaction_status: { label: 'Status', fieldRenderer: inputTransactionStatus },

    // ── Attachment fields ────────────────────────────────────────
    file_name: { label: 'Nazwa pliku' },
    file_url: { label: 'URL' },
    file_type: { label: 'Typ pliku', fieldRenderer: outputFileType },
    file_size: { label: 'Rozmiar', fieldRenderer: outputFileSize },
    related_to_id: { label: 'ID powiązania', isHidden: true },
    related_to_type: { label: 'Typ powiązania', isHidden: true },

    // ── User role fields ─────────────────────────────────────────
    role: { label: 'Rola' },

    // ── Relation fields (from nested Supabase queries) ───────────
    tenants: { label: 'Najemca', fieldRenderer: outputTenantsRelation, isSortable: false },
    lease_agreements: { label: 'Umowy', fieldRenderer: outputLeaseAgreementsRelation, isSortable: false },
    properties: { label: 'Nieruchomość', fieldRenderer: outputPropertiesRelation, isSortable: false },
    transactions: { label: 'Transakcje', fieldRenderer: outputTransactionsRelation, isSortable: false },
    attachments: { label: 'Załączniki', fieldRenderer: outputAttachmentsRelation, isSortable: false },

    // ── View-specific fields (computed columns) ──────────────────
    tenant_name: { label: 'Najemca' },
    tenant_email: { label: 'Email najemcy' },
    tenant_phone: { label: 'Telefon najemcy' },
    property_name: { label: 'Nieruchomość' },
    property_address: { label: 'Adres' },
    days_active: { label: 'Dni aktywnych', fieldRenderer: outputDaysCount },
    days_until_end: { label: 'Dni do końca', fieldRenderer: outputDaysCount },
    total_income: { label: 'Przychody', fieldRenderer: outputCurrency },
    total_expenses: { label: 'Wydatki', fieldRenderer: outputCurrency },
    net_profit: { label: 'Zysk netto', fieldRenderer: outputCurrency },
    current_tenant_name: { label: 'Obecny najemca' },
    current_rent: { label: 'Obecny czynsz', fieldRenderer: outputCurrency },
    lease_start: { label: 'Początek najmu', fieldRenderer: outputDate },
    lease_end: { label: 'Koniec najmu', fieldRenderer: outputDate },
    unpaid_items_count: { label: 'Nieopłacone', fieldRenderer: outputItemCount },
    total_unpaid_amount: { label: 'Kwota nieopłacona', fieldRenderer: outputCurrency },
    overdue_items_count: { label: 'Zaległe', fieldRenderer: outputItemCount },
    total_overdue_amount: { label: 'Kwota zaległa', fieldRenderer: outputCurrency },
    earliest_due_date: { label: 'Najwcześniejszy termin', fieldRenderer: outputDate },
} as const;

// ── Resolver ────────────────────────────────────────────────────────

export const getFieldConfig = (
    fieldKey: string
): Required<FieldConfig> => {
    //registryConfig can be undefined

    const defaultConfig: Required<FieldConfig> = {
        label: fieldKey,
        fieldRenderer: inputText,
        isHidden: false,
        isSortable: true
    }

    const isProperKey = Object.keys(FIELD_REGISTRY).find((regKey) => regKey == fieldKey) ? true : false

    const fieldConfig = isProperKey ?
        { ...defaultConfig, ...FIELD_REGISTRY[fieldKey] } :
        defaultConfig

    return fieldConfig
};