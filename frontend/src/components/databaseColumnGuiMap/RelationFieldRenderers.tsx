'use client';
import type React from 'react';
import Link from 'next/link';
import { routes } from '@/api/routes/appRoutes';
import computedStyles from '@/components/styles/computedRenderers.module.css';
import relationStyles from '@/components/styles/relationRenderers.module.css';
import type { FieldRendererFn } from '../core/DatabaseColumnGuiMap/types';
import type { Database } from '@/api/database.types';


type Tenant = Partial<Database['public']['Tables']['tenants']['Row']>;
type Lease = Partial<Database['public']['Tables']['lease_agreements']['Row']>;
type Property = Partial<Database['public']['Tables']['properties']['Row']>;
type Transaction = Partial<Database['public']['Tables']['transactions']['Row']>;
type Attachment = Partial<Database['public']['Tables']['attachments']['Row']>;
type BadgeType = 'error' | 'warning' | 'type';

const LEASE_STATUS_LABELS: Record<string, string> = { active: 'Aktywna', expired: 'Wygasła', terminated: 'Rozwiązana' };
const TRANSACTION_STATUS_LABELS: Record<string, string> = { pending: 'Oczekująca', paid: 'Opłacona', overdue: 'Zaległa' };
const LEASE_STATUS_CLASSES: Record<string, string> = {
    active: relationStyles.leaseStatusActiveRenderer,
    expired: relationStyles.leaseStatusExpiredRenderer,
    terminated: relationStyles.leaseStatusTerminatedRenderer,
    draft: relationStyles.leaseStatusDraftRenderer,
};
const TRANSACTION_STATUS_CLASSES: Record<string, string> = {
    paid: relationStyles.transactionStatusPaidRenderer,
    pending: relationStyles.transactionStatusPendingRenderer,
    overdue: relationStyles.transactionStatusOverdueRenderer,
    cancelled: relationStyles.transactionStatusCancelledRenderer,
};
const RELATION_BADGE_CLASSES: Record<BadgeType, string> = {
    error: relationStyles.relationBadgeErrorRenderer,
    warning: relationStyles.relationBadgeWarningRenderer,
    type: relationStyles.relationBadgeTypeRenderer,
};
const POLISH_CURRENCY = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' });

const outputNull = (label = '—'): React.ReactNode => <span className={computedStyles.nullRenderer}>{label}</span>;
const stopPropagation = (event: React.MouseEvent): void => event.stopPropagation();
const formatCurrency = (value?: number): string => POLISH_CURRENCY.format(value ?? 0);
const getClassName = (map: Record<string, string>, key: string | undefined, fallback: string): string => map[key ?? ''] ?? fallback;
const getFullName = (firstName?: string, lastName?: string): string => `${firstName ?? ''} ${lastName ?? ''}`.trim();
const createReadOnlyRenderer = (render: (value: unknown) => React.ReactNode): FieldRendererFn => ({ value }) => render(value);
const renderLink = (href: string | undefined, content: React.ReactNode): React.ReactNode =>
    href ? <Link href={href} onClick={stopPropagation} className={relationStyles.relationLinkRenderer}>{content}</Link> : content;
const asArray = <T,>(value: unknown): readonly T[] => Array.isArray(value) ? value as readonly T[] : [];
const asRecord = <T,>(value: unknown): T | null => value !== null && value !== undefined && !Array.isArray(value) ? value as T : null;

// ── Tenants Relation ───────────────────────────────────────────────

export const tenantsRelationRenderer = createReadOnlyRenderer((value) => {
    const records = asArray<Tenant>(value);
    const record = asRecord<Tenant>(value);
    return value === null || value === undefined ? outputNull() : Array.isArray(value)
        ? <div className={relationStyles.relationBadgesRenderer}>
            {records.slice(0, 3).map((tenant, index) =>
                <span key={tenant.id ?? index} className={relationStyles.relationBadgeRenderer}>{getFullName(tenant.first_name, tenant.last_name)}</span>,
            )}
            {records.length > 3 ? <span className={`${relationStyles.relationBadgeRenderer} ${relationStyles.relationBadgeMoreRenderer}`}>+{records.length - 3}</span> : null}
        </div>
        : renderLink(
            record?.id ? routes.landlord.tenants({ id: record.id }) : undefined,
            <span className={record?.id ? undefined : relationStyles.relationNameRenderer}>{getFullName(record?.first_name, record?.last_name)}</span>,
        );
});

// ── Lease Agreements Relation ──────────────────────────────────────

export const leaseAgreementsRelationRenderer = createReadOnlyRenderer((value) => {
    const records = asArray<Lease>(value);
    const record = asRecord<Lease>(value);
    const active = records.find((lease) => lease?.lease_status === 'active');
    const status = record?.lease_status;
    const label = LEASE_STATUS_LABELS[status ?? ''] ?? status ?? '—';
    const statusClass = getClassName(LEASE_STATUS_CLASSES, status, relationStyles.leaseStatusDefaultRenderer);
    const content = <>
        <span className={`${relationStyles.leaseStatusRenderer} ${statusClass}`}>{label}</span>
        <span className={relationStyles.leaseRentRenderer}>{formatCurrency(record?.monthly_rent)}</span>
    </>;

    return value === null || value === undefined ? outputNull('Brak umów') : Array.isArray(value)
        ? <div className={relationStyles.relationSingleRenderer}>
            <span className={relationStyles.leasesCountRenderer}>{records.length} umów</span>
            {active
                ? <span className={relationStyles.leasesActiveRenderer}>{formatCurrency(active.monthly_rent)}/mies</span>
                : <span className={relationStyles.leasesHintRenderer}>brak aktywnych</span>}
        </div>
        : record?.id
            ? renderLink(routes.landlord.leases({ id: record.id }), content)
            : <div className={relationStyles.relationSingleRenderer}>{content}</div>;
});

// ── Properties Relation ────────────────────────────────────────────

export const propertiesRelationRenderer = createReadOnlyRenderer((value) => {
    const records = asArray<Property>(value);
    const record = asRecord<Property>(value);
    return value === null || value === undefined ? outputNull() : Array.isArray(value)
        ? <div className={relationStyles.relationBadgesRenderer}>
            <span className={relationStyles.relationBadgeRenderer}>{records.length} nieruchomości</span>
            {records.slice(0, 2).map((property, index) =>
                <span key={property.id ?? index} className={`${relationStyles.relationBadgeRenderer} ${RELATION_BADGE_CLASSES.type}`}>{property.name}</span>,
            )}
        </div>
        : <div className={relationStyles.relationSingleRenderer}>
            {renderLink(
                record?.id ? routes.landlord.properties({ id: record.id }) : undefined,
                <span className={record?.id ? undefined : relationStyles.relationNameRenderer}>{record?.name}</span>,
            )}
            <span className={relationStyles.relationSubRenderer}>{record?.address}</span>
        </div>;
});

// ── Transactions Relation ──────────────────────────────────────────

export const transactionsRelationRenderer = createReadOnlyRenderer((value) => {
    const records = asArray<Transaction>(value);
    const record = asRecord<Transaction>(value);
    const overdueCount = records.filter((transaction) => transaction?.transaction_status === 'overdue').length;
    const pendingCount = records.filter((transaction) => transaction?.transaction_status === 'pending').length;
    const status = record?.transaction_status;
    const label = TRANSACTION_STATUS_LABELS[status ?? ''] ?? status ?? '—';
    const statusClass = getClassName(TRANSACTION_STATUS_CLASSES, status, relationStyles.transactionStatusDefaultRenderer);
    const content = <>
        <span className={`${relationStyles.transactionStatusRenderer} ${statusClass}`}>{label}</span>
        <span className={relationStyles.transactionAmountRenderer}>{formatCurrency(record?.amount)}</span>
    </>;

    return value === null || value === undefined ? outputNull() : Array.isArray(value)
        ? <div className={relationStyles.relationSingleRenderer}>
            <span className={relationStyles.transactionsCountRenderer}>{records.length} transakcji</span>
            {overdueCount > 0
                ? <span className={`${relationStyles.relationBadgeRenderer} ${RELATION_BADGE_CLASSES.error}`}>{overdueCount} zaległych</span>
                : pendingCount > 0
                    ? <span className={`${relationStyles.relationBadgeRenderer} ${RELATION_BADGE_CLASSES.warning}`}>{pendingCount} oczekujących</span>
                    : null}
        </div>
        : record?.id
            ? renderLink(routes.landlord.transactions({ id: record.id }), content)
            : <div className={relationStyles.relationSingleRenderer}>{content}</div>;
});

// ── Attachments Relation ───────────────────────────────────────────

export const attachmentsRelationRenderer = createReadOnlyRenderer((value) => {
    const records = asArray<Attachment>(value);
    return value === null || value === undefined
        ? outputNull()
        : Array.isArray(value)
            ? <span className={relationStyles.relationBadgeRenderer}>{records.length} plików</span>
            : <span className={relationStyles.relationBadgeRenderer}>1 plik</span>;
});