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


// function initFieldConfig(fieldConfig: Partial<FieldConfig>) {
//     const completedFieldConfig: FieldConfig = {
//         label: fieldConfig.label || '',
//         fieldOutput: (value)=> 
//         fieldInput: function (value: unknown, onChange: (value: unknown) => void): React.ReactNode {
//             throw new Error('Function not implemented.');
//         },
//         hidden: false,
//         sortable: false
//     }

// }


export const FIELD_REGISTRY: Record<string, FieldConfig> = {
    // ── Common system fields ─────────────────────────────────────
    id: {
        label: 'ID', hidden: true,
        fieldOutput: function (value: unknown): React.ReactNode {
            throw new Error('Function not implemented.');
        },
        fieldInput: function (value: unknown, onChange: (value: unknown) => void): React.ReactNode {
            throw new Error('Function not implemented.');
        },
        sortable: false
    },
    created_at: {
        label: 'Utworzono', fieldOutput: outputDateTime,
        fieldInput: function (value: unknown, onChange: (value: unknown) => void): React.ReactNode {
            throw new Error('Function not implemented.');
        },
        hidden: false,
        sortable: false
    },
    updated_at: {
        label: 'Zaktualizowano', fieldOutput: outputDateTime,
        fieldInput: function (value: unknown, onChange: (value: unknown) => void): React.ReactNode {
            throw new Error('Function not implemented.');
        },
        hidden: false,
        sortable: false
    },
    created_by: {
        label: 'Utworzył', hidden: true,
        fieldOutput: function (value: unknown): React.ReactNode {
            throw new Error('Function not implemented.');
        },
        fieldInput: function (value: unknown, onChange: (value: unknown) => void): React.ReactNode {
            throw new Error('Function not implemented.');
        },
        sortable: false
    },

    // ── Common contact fields ────────────────────────────────────
    email: {
        label: 'Email', fieldOutput: outputText, fieldInput: inputEmail,
        hidden: false,
        sortable: false
    },
    phone: {
        label: 'Telefon', fieldOutput: outputText, fieldInput: inputText,
        hidden: false,
        sortable: false
    },

    // ── Property fields ──────────────────────────────────────────
    name: {
        label: 'Nazwa', fieldOutput: outputText, fieldInput: inputTextRequired,
        hidden: false,
        sortable: false
    },
    address: {
        label: 'Adres', fieldOutput: outputText, fieldInput: inputTextRequired,
        hidden: false,
        sortable: false
    },
    property_type: {
        label: 'Typ nieruchomości',
        fieldOutput: outputPropertyType,
        fieldInput: inputPropertyType,
        hidden: false,
        sortable: false
    },
    monthly_rent: {
        label: 'Czynsz miesięczny',
        fieldOutput: outputCurrency,
        fieldInput: inputCurrency,
        hidden: false,
        sortable: false
    },
    deposit_amount: {
        label: 'Kaucja',
        fieldOutput: outputCurrency,
        fieldInput: inputCurrency,
        hidden: false,
        sortable: false
    },
    status: {
        label: 'Status',
        fieldOutput: outputPropertyStatus,
        fieldInput: inputPropertyStatus,
        hidden: false,
        sortable: false
    },
    size_sqm: {
        label: 'Powierzchnia (m²)', fieldOutput: outputNumber, fieldInput: inputNumber,
        hidden: false,
        sortable: false
    },
    bedrooms: {
        label: 'Sypialnie', fieldOutput: outputNumber, fieldInput: inputNumber,
        hidden: false,
        sortable: false
    },
    notes: {
        label: 'Notatki', fieldOutput: outputText, fieldInput: inputTextarea,
        hidden: false,
        sortable: false
    },

    // ── Tenant fields ────────────────────────────────────────────
    first_name: {
        label: 'Imię', fieldOutput: outputText, fieldInput: inputTextRequired,
        hidden: false,
        sortable: false
    },
    last_name: {
        label: 'Nazwisko', fieldOutput: outputText, fieldInput: inputTextRequired,
        hidden: false,
        sortable: false
    },
    id_document_number: {
        label: 'Nr dokumentu', fieldOutput: outputText, fieldInput: inputText,
        hidden: false,
        sortable: false
    },
    emergency_contact_name: {
        label: 'Kontakt awaryjny', fieldOutput: outputText, fieldInput: inputText,
        hidden: false,
        sortable: false
    },
    emergency_contact_phone: {
        label: 'Tel. kontaktu awaryjnego', fieldOutput: outputText, fieldInput: inputText,
        hidden: false,
        sortable: false
    },
    user_id: {
        label: 'ID użytkownika', hidden: true,
        fieldOutput: function (value: unknown): React.ReactNode {
            throw new Error('Function not implemented.');
        },
        fieldInput: function (value: unknown, onChange: (value: unknown) => void): React.ReactNode {
            throw new Error('Function not implemented.');
        },
        sortable: false
    },
    tenant_status: {
        label: 'Status',
        fieldOutput: outputTenantStatus,
        fieldInput: inputTenantStatus,
        hidden: false,
        sortable: false
    },

    // ── Lease fields ─────────────────────────────────────────────
    tenant_id: {
        label: 'Najemca', hidden: true,
        fieldOutput: function (value: unknown): React.ReactNode {
            throw new Error('Function not implemented.');
        },
        fieldInput: function (value: unknown, onChange: (value: unknown) => void): React.ReactNode {
            throw new Error('Function not implemented.');
        },
        sortable: false
    },
    property_id: {
        label: 'Nieruchomość', fieldOutput: outputText, hidden: true,
        fieldInput: function (value: unknown, onChange: (value: unknown) => void): React.ReactNode {
            throw new Error('Function not implemented.');
        },
        sortable: false
    },
    start_date: {
        label: 'Data rozpoczęcia', fieldOutput: outputDate, fieldInput: inputDate,
        hidden: false,
        sortable: false
    },
    end_date: {
        label: 'Data zakończenia', fieldOutput: outputDate, fieldInput: inputDate,
        hidden: false,
        sortable: false
    },
    lease_status: {
        label: 'Status',
        fieldOutput: outputLeaseStatus,
        fieldInput: inputLeaseStatus,
        hidden: false,
        sortable: false
    },

    // ── Transaction fields ───────────────────────────────────────
    lease_id: {
        label: 'Umowa', hidden: true,
        fieldOutput: function (value: unknown): React.ReactNode {
            throw new Error('Function not implemented.');
        },
        fieldInput: function (value: unknown, onChange: (value: unknown) => void): React.ReactNode {
            throw new Error('Function not implemented.');
        },
        sortable: false
    },
    type: {
        label: 'Typ',
        fieldOutput: outputTransactionType,
        fieldInput: inputTransactionType,
        hidden: false,
        sortable: false
    },
    description: {
        label: 'Opis', fieldOutput: outputText, fieldInput: inputText,
        hidden: false,
        sortable: false
    },
    amount: {
        label: 'Kwota', fieldOutput: outputCurrency, fieldInput: inputCurrency,
        hidden: false,
        sortable: false
    },
    due_date: {
        label: 'Termin', fieldOutput: outputDate, fieldInput: inputDate,
        hidden: false,
        sortable: false
    },
    transaction_status: {
        label: 'Status',
        fieldOutput: outputTransactionStatus,
        fieldInput: inputTransactionStatus,
        hidden: false,
        sortable: false
    },

    // ── Attachment fields ────────────────────────────────────────
    file_name: {
        label: 'Nazwa pliku', fieldOutput: outputText,
        fieldInput: function (value: unknown, onChange: (value: unknown) => void): React.ReactNode {
            throw new Error('Function not implemented.');
        },
        hidden: false,
        sortable: false
    },
    file_url: {
        label: 'URL', fieldOutput: outputText,
        fieldInput: function (value: unknown, onChange: (value: unknown) => void): React.ReactNode {
            throw new Error('Function not implemented.');
        },
        hidden: false,
        sortable: false
    },
    file_type: {
        label: 'Typ pliku', fieldOutput: outputFileType,
        fieldInput: function (value: unknown, onChange: (value: unknown) => void): React.ReactNode {
            throw new Error('Function not implemented.');
        },
        hidden: false,
        sortable: false
    },
    file_size: {
        label: 'Rozmiar', fieldOutput: outputFileSize,
        fieldInput: function (value: unknown, onChange: (value: unknown) => void): React.ReactNode {
            throw new Error('Function not implemented.');
        },
        hidden: false,
        sortable: false
    },
    related_to_id: {
        label: 'ID powiązania', hidden: true,
        fieldOutput: function (value: unknown): React.ReactNode {
            throw new Error('Function not implemented.');
        },
        fieldInput: function (value: unknown, onChange: (value: unknown) => void): React.ReactNode {
            throw new Error('Function not implemented.');
        },
        sortable: false
    },
    related_to_type: {
        label: 'Typ powiązania', hidden: true,
        fieldOutput: function (value: unknown): React.ReactNode {
            throw new Error('Function not implemented.');
        },
        fieldInput: function (value: unknown, onChange: (value: unknown) => void): React.ReactNode {
            throw new Error('Function not implemented.');
        },
        sortable: false
    },

    // ── User role fields ─────────────────────────────────────────
    role: {
        label: 'Rola', fieldOutput: outputText,
        fieldInput: function (value: unknown, onChange: (value: unknown) => void): React.ReactNode {
            throw new Error('Function not implemented.');
        },
        hidden: false,
        sortable: false
    },

    // ── Relation fields (from nested Supabase queries) ───────────
    // Note: Relation fields are not sortable - they contain nested objects/arrays
    tenants: {
        label: 'Najemca',
        fieldOutput: outputTenantsRelation,
        sortable: false,
        fieldInput: function (value: unknown, onChange: (value: unknown) => void): React.ReactNode {
            throw new Error('Function not implemented.');
        },
        hidden: false
    },
    lease_agreements: {
        label: 'Umowy',
        fieldOutput: outputLeaseAgreementsRelation,
        sortable: false,
        fieldInput: function (value: unknown, onChange: (value: unknown) => void): React.ReactNode {
            throw new Error('Function not implemented.');
        },
        hidden: false
    },
    properties: {
        label: 'Nieruchomość',
        fieldOutput: outputPropertiesRelation,
        sortable: false,
        fieldInput: function (value: unknown, onChange: (value: unknown) => void): React.ReactNode {
            throw new Error('Function not implemented.');
        },
        hidden: false
    },
    transactions: {
        label: 'Transakcje',
        fieldOutput: outputTransactionsRelation,
        sortable: false,
        fieldInput: function (value: unknown, onChange: (value: unknown) => void): React.ReactNode {
            throw new Error('Function not implemented.');
        },
        hidden: false
    },
    attachments: {
        label: 'Załączniki',
        fieldOutput: outputAttachmentsRelation,
        sortable: false,
        fieldInput: function (value: unknown, onChange: (value: unknown) => void): React.ReactNode {
            throw new Error('Function not implemented.');
        },
        hidden: false
    },

    // ── View-specific fields (computed columns) ──────────────────
    tenant_name: {
        label: 'Najemca', fieldOutput: outputText,
        fieldInput: function (value: unknown, onChange: (value: unknown) => void): React.ReactNode {
            throw new Error('Function not implemented.');
        },
        hidden: false,
        sortable: false
    },
    tenant_email: {
        label: 'Email najemcy', fieldOutput: outputText,
        fieldInput: function (value: unknown, onChange: (value: unknown) => void): React.ReactNode {
            throw new Error('Function not implemented.');
        },
        hidden: false,
        sortable: false
    },
    tenant_phone: {
        label: 'Telefon najemcy', fieldOutput: outputText,
        fieldInput: function (value: unknown, onChange: (value: unknown) => void): React.ReactNode {
            throw new Error('Function not implemented.');
        },
        hidden: false,
        sortable: false
    },
    property_name: {
        label: 'Nieruchomość', fieldOutput: outputText,
        fieldInput: function (value: unknown, onChange: (value: unknown) => void): React.ReactNode {
            throw new Error('Function not implemented.');
        },
        hidden: false,
        sortable: false
    },
    property_address: {
        label: 'Adres', fieldOutput: outputText,
        fieldInput: function (value: unknown, onChange: (value: unknown) => void): React.ReactNode {
            throw new Error('Function not implemented.');
        },
        hidden: false,
        sortable: false
    },
    days_active: {
        label: 'Dni aktywnych', fieldOutput: outputDaysCount,
        fieldInput: function (value: unknown, onChange: (value: unknown) => void): React.ReactNode {
            throw new Error('Function not implemented.');
        },
        hidden: false,
        sortable: false
    },
    days_until_end: {
        label: 'Dni do końca', fieldOutput: outputDaysCount,
        fieldInput: function (value: unknown, onChange: (value: unknown) => void): React.ReactNode {
            throw new Error('Function not implemented.');
        },
        hidden: false,
        sortable: false
    },
    total_income: {
        label: 'Przychody', fieldOutput: outputCurrency,
        fieldInput: function (value: unknown, onChange: (value: unknown) => void): React.ReactNode {
            throw new Error('Function not implemented.');
        },
        hidden: false,
        sortable: false
    },
    total_expenses: {
        label: 'Wydatki', fieldOutput: outputCurrency,
        fieldInput: function (value: unknown, onChange: (value: unknown) => void): React.ReactNode {
            throw new Error('Function not implemented.');
        },
        hidden: false,
        sortable: false
    },
    net_profit: {
        label: 'Zysk netto', fieldOutput: outputCurrency,
        fieldInput: function (value: unknown, onChange: (value: unknown) => void): React.ReactNode {
            throw new Error('Function not implemented.');
        },
        hidden: false,
        sortable: false
    },
    current_tenant_name: {
        label: 'Obecny najemca', fieldOutput: outputText,
        fieldInput: function (value: unknown, onChange: (value: unknown) => void): React.ReactNode {
            throw new Error('Function not implemented.');
        },
        hidden: false,
        sortable: false
    },
    current_rent: {
        label: 'Obecny czynsz', fieldOutput: outputCurrency,
        fieldInput: function (value: unknown, onChange: (value: unknown) => void): React.ReactNode {
            throw new Error('Function not implemented.');
        },
        hidden: false,
        sortable: false
    },
    lease_start: {
        label: 'Początek najmu', fieldOutput: outputDate,
        fieldInput: function (value: unknown, onChange: (value: unknown) => void): React.ReactNode {
            throw new Error('Function not implemented.');
        },
        hidden: false,
        sortable: false
    },
    lease_end: {
        label: 'Koniec najmu', fieldOutput: outputDate,
        fieldInput: function (value: unknown, onChange: (value: unknown) => void): React.ReactNode {
            throw new Error('Function not implemented.');
        },
        hidden: false,
        sortable: false
    },
    unpaid_items_count: {
        label: 'Nieopłacone', fieldOutput: outputItemCount,
        fieldInput: function (value: unknown, onChange: (value: unknown) => void): React.ReactNode {
            throw new Error('Function not implemented.');
        },
        hidden: false,
        sortable: false
    },
    total_unpaid_amount: {
        label: 'Kwota nieopłacona', fieldOutput: outputCurrency,
        fieldInput: function (value: unknown, onChange: (value: unknown) => void): React.ReactNode {
            throw new Error('Function not implemented.');
        },
        hidden: false,
        sortable: false
    },
    overdue_items_count: {
        label: 'Zaległe', fieldOutput: outputItemCount,
        fieldInput: function (value: unknown, onChange: (value: unknown) => void): React.ReactNode {
            throw new Error('Function not implemented.');
        },
        hidden: false,
        sortable: false
    },
    total_overdue_amount: {
        label: 'Kwota zaległa', fieldOutput: outputCurrency,
        fieldInput: function (value: unknown, onChange: (value: unknown) => void): React.ReactNode {
            throw new Error('Function not implemented.');
        },
        hidden: false,
        sortable: false
    },
    earliest_due_date: {
        label: 'Najwcześniejszy termin', fieldOutput: outputDate,
        fieldInput: function (value: unknown, onChange: (value: unknown) => void): React.ReactNode {
            throw new Error('Function not implemented.');
        },
        hidden: false,
        sortable: false
    },
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