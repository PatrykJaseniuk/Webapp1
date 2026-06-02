// ── Domain entities ──
// Pure type aliases derived from generated Database types.
// No I/O, no React, no framework code.

import type { Database } from '@/backend/database.types';

// ──────────────────────────────────────────────
// Auth
// ──────────────────────────────────────────────

export type UserRole = Database['public']['Tables']['user_roles']['Row'];

export type LoginInput = {
  readonly email: string;
  readonly password: string;
};

export type SignupInput = {
  readonly email: string;
  readonly password: string;
  readonly firstName: string;
  readonly lastName: string;
};

// ──────────────────────────────────────────────
// Properties
// ──────────────────────────────────────────────

export type Property = Database['public']['Tables']['properties']['Row'];
export type PropertyInsert = Database['public']['Tables']['properties']['Insert'];
export type PropertyUpdate = Database['public']['Tables']['properties']['Update'];

// ──────────────────────────────────────────────
// Tenants
// ──────────────────────────────────────────────

export type Tenant = Database['public']['Tables']['tenants']['Row'];
export type TenantInsert = Database['public']['Tables']['tenants']['Insert'];
export type TenantUpdate = Database['public']['Tables']['tenants']['Update'];

// ──────────────────────────────────────────────
// Discriminated status/type unions (narrowed from raw string)
// ──────────────────────────────────────────────

export const PROPERTY_TYPES = ['apartment', 'house', 'commercial', 'room'] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const PROPERTY_STATUSES = ['available', 'occupied', 'inactive'] as const;
export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];

export const TENANT_STATUSES = ['active', 'past', 'applicant'] as const;
export type TenantStatus = (typeof TENANT_STATUSES)[number];