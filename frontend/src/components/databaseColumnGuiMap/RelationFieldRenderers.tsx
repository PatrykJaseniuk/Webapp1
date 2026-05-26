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
const asArray = <T,>(value: unknown): readonly T[] => Array.isArray(value) ? value as readonly T[] : [];
const asRecord = <T,>(value: unknown): T | null => value !== null && value !== undefined && !Array.isArray(value) ? value as T : null;
const renderLink = (href: string | undefined, content: React.ReactNode): React.ReactNode =>
    href ? <Link href={href} onClick={stopPropagation} className={relationStyles.relationLinkRenderer}>{content}</Link> : content;
const renderBadge = (content: React.ReactNode, tone?: BadgeType, key?: React.Key): React.ReactNode =>
    <span key={key} className={[relationStyles.relationBadgeRenderer, tone ? RELATION_BADGE_CLASSES[tone] : ''].filter(Boolean).join(' ')}>{content}</span>;
const renderStack = (primary: React.ReactNode, secondary?: React.ReactNode): React.ReactNode =>
    <div className={relationStyles.relationStackRenderer}>
        <div className={relationStyles.relationPrimaryRenderer}>{primary}</div>
        <div className={relationStyles.relationSecondaryRenderer}>{secondary ?? <span className={relationStyles.relationSecondaryPlaceholder}> </span>}</div>
    </div>;

// ── Tenants Relation ───────────────────────────────────────────────

export const tenantsRelationRenderer = createReadOnlyRenderer((value) => {
    const records = asArray<Tenant>(value);
    const record = asRecord<Tenant>(value);
    return value === null || value === undefined ? outputNull() : Array.isArray(value)
        ? <div className={relationStyles.relationBadgesRenderer}>
            {records.slice(0, 3).map((tenant, index) => renderBadge(getFullName(tenant.first_name, tenant.last_name), undefined, tenant.id ?? index))}
            {records.length > 3 ? renderBadge(`+${records.length - 3}`, undefined, 'more') : null}
        </div>
        : renderStack(renderLink(
            record?.id ? routes.landlord.tenants({ id: record.id }) : undefined,
            <span className={record?.id ? undefined : relationStyles.relationNameRenderer}>{getFullName(record?.first_name, record?.last_name)}</span>,
        ));
});

// ── Lease Agreements Relation ──────────────────────────────────────

export const leaseAgreementsRelationRenderer = createReadOnlyRenderer((value) => {
    const records = asArray<Lease>(value);
    const record = asRecord<Lease>(value);
    const active = records.find((lease) => lease?.lease_status === 'active');
    const status = record?.lease_status;
    const label = LEASE_STATUS_LABELS[status ?? ''] ?? status ?? '—';
    const statusClass = getClassName(LEASE_STATUS_CLASSES, status, relationStyles.leaseStatusDefaultRenderer);
    const content = renderStack(
        <>
            <span className={`${relationStyles.leaseStatusRenderer} ${statusClass}`}>{label}</span>
            <span className={relationStyles.relationValueRenderer}>{formatCurrency(record?.monthly_rent)}</span>
        </>,
        <span className={relationStyles.relationSubRenderer}>czynsz miesięczny</span>,
    );

    return value === null || value === undefined ? outputNull('Brak umów') : Array.isArray(value)
        ? renderStack(
            <span className={relationStyles.relationSummaryRenderer}>{records.length} umów</span>,
            active
                ? <span className={relationStyles.relationAccentRenderer}>{formatCurrency(active.monthly_rent)}/mies</span>
                : <span className={relationStyles.relationMutedRenderer}>brak aktywnych</span>,
        )
        : record?.id
            ? renderLink(routes.landlord.leases({ id: record.id }), content)
            : content;
});

// ── Properties Relation ────────────────────────────────────────────

export const propertiesRelationRenderer = createReadOnlyRenderer((value) => {
    const records = asArray<Property>(value);
    const record = asRecord<Property>(value);
    return value === null || value === undefined ? outputNull() : Array.isArray(value)
        ? <div className={relationStyles.relationBadgesRenderer}>
            {renderBadge(`${records.length} nieruchomości`, undefined, 'count')}
            {records.slice(0, 2).map((property, index) => renderBadge(property.name, 'type', property.id ?? index))}
        </div>
        : renderStack(
            renderLink(
                record?.id ? routes.landlord.properties({ id: record.id }) : undefined,
                <span className={record?.id ? undefined : relationStyles.relationNameRenderer}>{record?.name}</span>,
            ),
            <span className={relationStyles.relationSubRenderer}>{record?.address}</span>,
        );
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
    const content = renderStack(
        <>
            <span className={`${relationStyles.transactionStatusRenderer} ${statusClass}`}>{label}</span>
            <span className={relationStyles.relationValueRenderer}>{formatCurrency(record?.amount)}</span>
        </>,
        <span className={relationStyles.relationSubRenderer}>status płatności</span>,
    );

    return value === null || value === undefined ? outputNull() : Array.isArray(value)
        ? renderStack(
            <span className={relationStyles.relationSummaryRenderer}>{records.length} transakcji</span>,
            overdueCount > 0
                ? renderBadge(`${overdueCount} zaległych`, 'error')
                : pendingCount > 0
                    ? renderBadge(`${pendingCount} oczekujących`, 'warning')
                    : <span className={relationStyles.relationSecondaryPlaceholder}> </span>,
        )
        : record?.id
            ? renderLink(routes.landlord.transactions({ id: record.id }), content)
            : content;
});

// ── Attachments Relation ───────────────────────────────────────────

export const attachmentsRelationRenderer = createReadOnlyRenderer((value) => {
    const records = asArray<Attachment>(value);
    return value === null || value === undefined
        ? outputNull()
        : renderBadge(Array.isArray(value) ? `${records.length} plików` : '1 plik');
});