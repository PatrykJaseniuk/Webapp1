import { match } from 'ts-pattern';
import { useAuth, type AppRole } from './AuthContext';

// ── URL object shape ──

type UrlObject = Readonly<{
  login: () => '/login';
  signup: () => '/signup';
  dashboard: () => string;
  propertiesList: () => string;
  propertyDetail: (id: string) => string;
  tenantsList: () => string;
  tenantDetail: (id: string) => string;
  leasesList: () => string;
  leaseDetail: (id: string) => string;
  transactionsList: () => string;
  transactionDetail: (id: string) => string;
}>;

// ── Discriminated union — forces consumers to handle auth loading ──

export type UrlsResult =
  | { readonly tag: 'pending' }
  | { readonly tag: 'ready'; readonly url: UrlObject };

// ── Pure: role → UrlObject ──

const buildUrls = (role: AppRole): UrlObject => {
  const path = (suffix: string): string => `/${role}${suffix}`;

  return {
    login:              () => '/login',
    signup:             () => '/signup',
    dashboard:          () => path(''),
    propertiesList:     () => path('/properties'),
    propertyDetail:     (id: string) => path(`/properties/${id}`),
    tenantsList:        () => path('/tenants'),
    tenantDetail:       (id: string) => path(`/tenants/${id}`),
    leasesList:         () => path('/leases'),
    leaseDetail:        (id: string) => path(`/leases/${id}`),
    transactionsList:   () => path('/transactions'),
    transactionDetail:  (id: string) => path(`/transactions/${id}`),
  };
};

// ── Hook ──

export const useUrls = (): UrlsResult =>
  match(useAuth())
    .with({ tag: 'loading' }, () => ({ tag: 'pending' } as const))
    .with({ tag: 'unauthenticated' }, () => ({ tag: 'ready' as const, url: buildUrls('tenant') }))
    .with({ tag: 'authenticated' }, (auth) => ({ tag: 'ready' as const, url: buildUrls(auth.role) }))
    .exhaustive();