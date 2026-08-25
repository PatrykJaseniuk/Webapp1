export type PropertyStatus = 'available' | 'occupied' | 'inactive';
export type PropertyType = 'apartment' | 'house' | 'commercial' | 'room';
export type LeaseStatus = 'active' | 'expired' | 'terminated';
export type TenantStatus = 'active' | 'past' | 'applicant';

export const PROPERTY_STATUS_LABEL: Readonly<Record<PropertyStatus, string>> = Object.freeze({
  available: 'Dostępna',
  occupied: 'Zajęta',
  inactive: 'Nieaktywna',
});

export const PROPERTY_TYPE_LABEL: Readonly<Record<PropertyType, string>> = Object.freeze({
  apartment: 'Mieszkanie',
  house: 'Dom',
  commercial: 'Lokal',
  room: 'Pokój',
});

export const LEASE_STATUS_LABEL: Readonly<Record<LeaseStatus, string>> = Object.freeze({
  active: 'Aktywna',
  expired: 'Wygasła',
  terminated: 'Rozwiązana',
});

export const TENANT_STATUS_LABEL: Readonly<Record<TenantStatus, string>> = Object.freeze({
  active: 'Aktywny',
  past: 'Były',
  applicant: 'Kandydat',
});
