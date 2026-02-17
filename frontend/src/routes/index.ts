// ─── Search Param Types ─────────────────────────────────────────────────────
// Each type defines the search params accepted by a route.
// Used BOTH in route generators (building URLs) and in page components (reading params).

export type PropertyRouteParams = {
    id?: string;
    action?: 'detail' | 'edit' | 'new';
};

export type TenantRouteParams = {
    id?: string;
    action?: 'detail' | 'edit' | 'new';
};

export type LeaseRouteParams = {
    id?: string;
    action?: 'detail' | 'edit' | 'new';
};

export type BillingRouteParams = {
    id?: string;
    action?: 'new';
};

export type TransactionRouteParams = {
    id?: string;
    action?: 'detail' | 'edit' | 'new';
};

export type ExpenseRouteParams = {
    id?: string;
    action?: 'new';
};

// ─── URL Builder ────────────────────────────────────────────────────────────

const buildUrl = (base: string, params?: Record<string, string | undefined>): string => {
    const entries = Object.entries(params ?? {}).filter(
        (entry): entry is [string, string] => entry[1] !== undefined,
    );
    const qs = new URLSearchParams(entries).toString();
    return qs ? `${base}?${qs}` : base;
};

// ─── Route Generators ───────────────────────────────────────────────────────

export const routes = {
    home: () => '/',
    login: () => '/login',
    signup: () => '/signup',

    landlord: {
        dashboard: () => '/landlord',
        properties: (params?: PropertyRouteParams) =>
            buildUrl('/landlord/properties', params),
        tenants: (params?: TenantRouteParams) =>
            buildUrl('/landlord/tenants', params),
        leases: (params?: LeaseRouteParams) =>
            buildUrl('/landlord/leases', params),
        payments: (params?: TransactionRouteParams) =>
            buildUrl('/landlord/transactions', params),
    },

    tenant: {
        dashboard: () => '/tenant/dashboard',
        properties: () => '/tenant/properties',
        leases: () => '/tenant/leases',
        billing: () => '/tenant/billing',
        meters: () => '/tenant/meters',
        profile: () => '/tenant/profile',
    },

    admin: {
        users: () => '/admin/users',
    },
};

// ─── Role Redirects (single source of truth) ───────────────────────────────

export const ROLE_REDIRECTS: Record<string, string> = {
    tenant: routes.tenant.dashboard(),
    landlord: routes.landlord.dashboard(),
    admin: routes.admin.users(),
};
