import type {
  LeaseStatus,
  PropertyStatus,
  TenantStatus,
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

export const amountClass = (amount: number): string =>
  `text-sm font-medium ${amount >= 0 ? 'text-green-700' : 'text-red-700'}`;

/**
 * A running balance is a STATE, not a movement, so it is not colour-graded per
 * row the way an amount is. Only its sign is marked, and it is marked with a
 * glyph as well as a colour — colour alone must never carry meaning
 * (WCAG 1.4.1). Callers supply the wording, because a negative balance means
 * "tenant owes" on a lease, "loss" on a property and "overdrawn" on a treasury.
 */
export const balanceGlyph = (balance: number): string => (balance < 0 ? '▼' : balance > 0 ? '▲' : '–');

export const balanceToneClass = (balance: number): string =>
  balance < 0 ? 'text-red-700' : balance > 0 ? 'text-gray-900' : 'text-gray-500';