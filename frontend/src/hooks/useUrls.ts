import { useAuth, type AppRole } from './AuthContext';

export const useUrls = (): {
  readonly url: {
    readonly login: () => '/login';
    readonly signup: () => '/signup';
    readonly dashboard: () => string;
    readonly propertiesList: () => string;
    readonly propertyDetail: (id: string) => string;
    readonly tenantsList: () => string;
    readonly tenantDetail: (id: string) => string;
    readonly leasesList: () => string;
    readonly leaseDetail: (id: string) => string;
    readonly transactionsList: () => string;
    readonly transactionDetail: (id: string) => string;
  };
} => {
  const auth = useAuth();
  const r: AppRole = auth.tag === 'authenticated' ? auth.role : 'tenant';

  const path = (suffix: string): string => `/${r}${suffix}`;

  return {
    url: {
      login:    () => '/login',
      signup:   () => '/signup',
      dashboard:          () => path(''),
      propertiesList:     () => path('/properties'),
      propertyDetail:     (id: string) => path(`/properties/${id}`),
      tenantsList:        () => path('/tenants'),
      tenantDetail:       (id: string) => path(`/tenants/${id}`),
      leasesList:         () => path('/leases'),
      leaseDetail:        (id: string) => path(`/leases/${id}`),
      transactionsList:   () => path('/transactions'),
      transactionDetail:  (id: string) => path(`/transactions/${id}`),
    },
  };
};