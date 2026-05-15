export type PropertyRouteParams = {
    id?: string;
    action?: 'new';
};

export type TenantRouteParams = {
    id?: string;
    action?: 'new';
};

export type LeaseRouteParams = {
    id?: string;
    action?: 'new';
};

export type TransactionRouteParams = {
    id?: string;
    action?: 'new';
};

const buildUrl = (base: string, params?: Record<string, string | undefined>): string => {
    const entries = Object.entries(params ?? {}).filter(
        (entry): entry is [string, string] => entry[1] !== undefined,
    );
    const qs = new URLSearchParams(entries).toString();
    return qs ? `${base}?${qs}` : base;
};

export const routes = {
    home: () => '/',
    login: () => '/login',
    signup: () => '/signup',

    landlord: {
        dashboard: () => '/landlord',
        properties: (params?: PropertyRouteParams) => buildUrl('/landlord/properties', params),
        tenants: (params?: TenantRouteParams) => buildUrl('/landlord/tenants', params),
        leases: (params?: LeaseRouteParams) => buildUrl('/landlord/leases', params),
        transactions: (params?: TransactionRouteParams) => buildUrl('/landlord/transactions', params),
    },

    tenant: {
        dashboard: () => '/tenant/dashboard',
    },
} as const;

export const ROLE_REDIRECTS: Record<string, string> = {
    tenant: routes.tenant.dashboard(),
    landlord: routes.landlord.dashboard(),
    admin: routes.landlord.dashboard(),
};
