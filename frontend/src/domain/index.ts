export type {
  Option,
  Either,
  UserId,
  AppError,
  AsyncState,
  Result,
} from './types';

export { ok, err } from './types';

export type {
  Property,
  PropertyInsert,
  PropertyUpdate,
  Tenant,
  TenantInsert,
  TenantUpdate,
  PropertyType,
  PropertyStatus,
  TenantStatus,
  UserRole,
  LoginInput,
  SignupInput,
} from './entities';

export {
  PROPERTY_TYPES,
  PROPERTY_STATUSES,
  TENANT_STATUSES,
} from './entities';
