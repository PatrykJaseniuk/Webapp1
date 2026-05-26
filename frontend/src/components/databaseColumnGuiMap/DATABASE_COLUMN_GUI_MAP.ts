'use client';

import { dateTimeRenderer, emailRenderer, textRequiredRenderer, enumRendererGenerator, currencyRenderer, numberRenderer, textareaRenderer, dateRenderer, fileSizeRenderer, daysCountRenderer, itemCountRenderer, FileTypeRendererGenerator } from "../core/DatabaseColumnGuiMap/BasicFieldRenderers";
import { tenantsRelationRenderer, leaseAgreementsRelationRenderer, propertiesRelationRenderer, transactionsRelationRenderer, attachmentsRelationRenderer } from "./RelationFieldRenderers";
import { FieldConfig } from "../core/DatabaseColumnGuiMap/types";


// DATABASE_COLUMN_GUI_MAP - this name was inspired by ORM(object relationship mapping). This object map db columns fields to proper gui component (this component is both for read and edit). Then this map is use in components for example responsible for rendering data acquired form db request in form of table. Thanks to this map component like that know how to render each field.   

export const DATABASE_COLUMN_GUI_MAP: Record<string, FieldConfig> = {
    // ── Common system fields ─────────────────────────────────────
    id: { label: 'ID', isHidden: true },
    created_at: { label: 'Utworzono', fieldRenderer: dateTimeRenderer },
    updated_at: { label: 'Zaktualizowano', fieldRenderer: dateTimeRenderer },
    created_by: { label: 'Utworzył', isHidden: true },

    // ── Common contact fields ────────────────────────────────────
    email: { label: 'Email', fieldRenderer: emailRenderer },
    phone: { label: 'Telefon' },

    // ── Property fields ──────────────────────────────────────────
    name: { label: 'Nazwa', fieldRenderer: textRequiredRenderer },
    address: { label: 'Adres', fieldRenderer: textRequiredRenderer },
    property_type: { label: 'Typ nieruchomości', fieldRenderer: enumRendererGenerator({ apartment: '🏠 Mieszkanie', house: '🏡 Dom', commercial: '🏢 Lokal usługowy', room: '🛏️ Pokój' }, 'Wybierz typ...') },
    monthly_rent: { label: 'Czynsz miesięczny', fieldRenderer: currencyRenderer },
    deposit_amount: { label: 'Kaucja', fieldRenderer: currencyRenderer },
    property_status: { label: 'Status', fieldRenderer: enumRendererGenerator({ available: 'Dostępna', occupied: 'Zajęta', inactive: 'Nieaktywna' }, 'Wybierz status...') },
    size_sqm: { label: 'Powierzchnia (m²)', fieldRenderer: numberRenderer },
    bedrooms: { label: 'Sypialnie', fieldRenderer: numberRenderer },
    notes: { label: 'Notatki', fieldRenderer: textareaRenderer },

    // ── Tenant fields ────────────────────────────────────────────
    first_name: { label: 'Imię', fieldRenderer: textRequiredRenderer },
    last_name: { label: 'Nazwisko', fieldRenderer: textRequiredRenderer },
    id_document_number: { label: 'Nr dokumentu' },
    emergency_contact_name: { label: 'Kontakt awaryjny' },
    emergency_contact_phone: { label: 'Tel. kontaktu awaryjnego' },
    user_id: { label: 'ID użytkownika', isHidden: true },
    tenant_status: { label: 'Status', fieldRenderer: enumRendererGenerator({ active: 'Aktywny', past: 'Były', applicant: 'Kandydat' }, 'Wybierz status...') },

    // ── Lease fields ─────────────────────────────────────────────
    tenant_id: { label: 'Najemca', isHidden: true },
    property_id: { label: 'Nieruchomość', isHidden: true },
    start_date: { label: 'Data rozpoczęcia', fieldRenderer: dateRenderer },
    end_date: { label: 'Data zakończenia', fieldRenderer: dateRenderer },
    lease_status: { label: 'Status', fieldRenderer: enumRendererGenerator({ active: 'Aktywna', expired: 'Wygasła', terminated: 'Rozwiązana' }, 'Wybierz status...') },

    // ── Transaction fields ───────────────────────────────────────
    lease_id: { label: 'Umowa', isHidden: true },
    type: { label: 'Typ', fieldRenderer: enumRendererGenerator({ rent: '💰 Czynsz', utility: '💡 Media', expense: '📤 Wydatek', payment: '💳 Wpłata', withdraw: '🏧 Wypłata', fee: '📋 Opłata', other: '📎 Inne' }, 'Wybierz typ...') },
    description: { label: 'Opis' },
    amount: { label: 'Kwota', fieldRenderer: currencyRenderer },
    due_date: { label: 'Termin', fieldRenderer: dateRenderer },
    transaction_status: { label: 'Status', fieldRenderer: enumRendererGenerator({ pending: 'Oczekująca', paid: 'Opłacona', overdue: 'Zaległa' }, 'Wybierz status...') },

    // ── Attachment fields ────────────────────────────────────────
    file_name: { label: 'Nazwa pliku' },
    file_url: { label: 'URL' },
    file_type: {
        label: 'Typ pliku',
        fieldRenderer: FileTypeRendererGenerator({
            image: { label: '🖼️ Obraz', color: 'enumBlueRenderer' },
            video: { label: '🎥 Wideo', color: 'enumPurpleRenderer' },
            pdf: { label: '📄 PDF', color: 'enumRedRenderer' },
            document: { label: '📝 Dokument', color: 'enumGreenRenderer' },
            other: { label: '📎 Inny', color: 'enumGrayRenderer' },
        }),
    },
    file_size: { label: 'Rozmiar', fieldRenderer: fileSizeRenderer },
    related_to_id: { label: 'ID powiązania', isHidden: true },
    related_to_type: { label: 'Typ powiązania', isHidden: true },

    // ── User role fields ─────────────────────────────────────────
    role: { label: 'Rola' },

    // ── Relation fields (from nested Supabase queries) ───────────
    tenants: { label: 'Najemca', fieldRenderer: tenantsRelationRenderer, isSortable: false },
    lease_agreements: { label: 'Umowy', fieldRenderer: leaseAgreementsRelationRenderer, isSortable: false },
    properties: { label: 'Nieruchomość', fieldRenderer: propertiesRelationRenderer, isSortable: false },
    transactions: { label: 'Transakcje', fieldRenderer: transactionsRelationRenderer, isSortable: false },
    attachments: { label: 'Załączniki', fieldRenderer: attachmentsRelationRenderer, isSortable: false },

    // ── View-specific fields (computed columns) ──────────────────
    tenant_name: { label: 'Najemca' },
    tenant_email: { label: 'Email najemcy' },
    tenant_phone: { label: 'Telefon najemcy' },
    property_name: { label: 'Nieruchomość' },
    property_address: { label: 'Adres' },
    days_active: { label: 'Dni aktywnych', fieldRenderer: daysCountRenderer },
    days_until_end: { label: 'Dni do końca', fieldRenderer: daysCountRenderer },
    total_income: { label: 'Przychody', fieldRenderer: currencyRenderer },
    total_expenses: { label: 'Wydatki', fieldRenderer: currencyRenderer },
    net_profit: { label: 'Zysk netto', fieldRenderer: currencyRenderer },
    current_tenant_name: { label: 'Obecny najemca' },
    current_rent: { label: 'Obecny czynsz', fieldRenderer: currencyRenderer },
    lease_start: { label: 'Początek najmu', fieldRenderer: dateRenderer },
    lease_end: { label: 'Koniec najmu', fieldRenderer: dateRenderer },
    unpaid_items_count: { label: 'Nieopłacone', fieldRenderer: itemCountRenderer },
    total_unpaid_amount: { label: 'Kwota nieopłacona', fieldRenderer: currencyRenderer },
    overdue_items_count: { label: 'Zaległe', fieldRenderer: itemCountRenderer },
    total_overdue_amount: { label: 'Kwota zaległa', fieldRenderer: currencyRenderer },
    earliest_due_date: { label: 'Najwcześniejszy termin', fieldRenderer: dateRenderer },
} as const;
