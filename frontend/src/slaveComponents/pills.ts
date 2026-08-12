import type {
  LeaseStatus,
  PropertyStatus,
  TenantStatus,
  TransactionStatus,
} from './domain';

export const pillClass = 'inline-block rounded-full px-2 py-0.5 text-xs font-medium';

export const propertyStatusPillClass = (status: PropertyStatus): string =>
  status === 'available' ?
    `${pillClass} bg-green-50 text-green-700` :
    status === 'occupied' ?
      `${pillClass} bg-blue-50 text-blue-700` :
      `${pillClass} bg-gray-50 text-gray-600`;

export const leaseStatusPillClass = (status: LeaseStatus): string =>
  status === 'active' ?
    `${pillClass} bg-green-50 text-green-700` :
    status === 'expired' ?
      `${pillClass} bg-gray-50 text-gray-600` :
      `${pillClass} bg-red-50 text-red-700`;

export const tenantStatusPillClass = (status: TenantStatus): string =>
  status === 'active' ?
    `${pillClass} bg-green-50 text-green-700` :
    status === 'past' ?
      `${pillClass} bg-gray-50 text-gray-600` :
      `${pillClass} bg-yellow-50 text-yellow-700`;

export const txnStatusPillClass = (status: TransactionStatus): string =>
  status === 'paid' ?
    `${pillClass} bg-green-50 text-green-700` :
    status === 'overdue' ?
      `${pillClass} bg-red-50 text-red-700` :
      `${pillClass} bg-yellow-50 text-yellow-700`;

export const amountClass = (amount: number): string =>
  `text-sm font-medium ${amount >= 0 ? 'text-green-700' : 'text-red-700'}`;