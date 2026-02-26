// ── Types ────────────────────────────────────────────────────────────

export type {
    FieldOutputFn,
    FieldInputFn,
    FieldConfig,
    FieldRegistry,
} from './types';

// ── Enum Labels ───────────────────────────────────────────────────────

export {
    PROPERTY_TYPE_LABELS,
    PROPERTY_STATUS_LABELS,
    TENANT_STATUS_LABELS,
    LEASE_STATUS_LABELS,
    TRANSACTION_TYPE_LABELS,
    TRANSACTION_STATUS_LABELS,
    FILE_TYPE_LABELS,
} from './enumLabels';

// ── Outputs ───────────────────────────────────────────────────────────

export {
    outputNull,
    outputText,
    outputNumber,
    outputBoolean,
    outputCurrency,
    outputDate,
    outputDateTime,
    outputDaysCount,
    outputItemCount,
    outputFileSize,
    outputPropertyType,
    outputPropertyStatus,
    outputTenantStatus,
    outputLeaseStatus,
    outputTransactionType,
    outputTransactionStatus,
    outputFileType,
    outputTenantsRelation,
    outputLeaseAgreementsRelation,
    outputPropertiesRelation,
    outputTransactionsRelation,
    outputAttachmentsRelation,
} from './outputs';

// ── Inputs ─────────────────────────────────────────────────────────────

export {
    inputText,
    inputTextRequired,
    inputEmail,
    inputTextarea,
    inputNumber,
    inputCurrency,
    inputDate,
    inputDateTime,
    inputBoolean,
    inputPropertyType,
    inputPropertyStatus,
    inputTenantStatus,
    inputLeaseStatus,
    inputTransactionType,
    inputTransactionStatus,
} from './inputs';

// ── Registry ──────────────────────────────────────────────────────────

export { FIELD_REGISTRY, resolveFieldConfig } from './registry';