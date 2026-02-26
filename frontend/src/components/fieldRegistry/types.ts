'use client';
import React from 'react';

// ── Function Types ───────────────────────────────────────────────────

/** Field output function - formats value for display */
export type FieldOutputFn<TValue = unknown> = (
    value: TValue,
    row: Record<string, unknown>
) => React.ReactNode;

/** Field input function - renders input component for editing */
export type FieldInputFn = (
    value: unknown,
    onChange: (value: unknown) => void
) => React.ReactNode;

// ── Configuration Types ──────────────────────────────────────────────

/** Field configuration */
export interface FieldConfig<TValue = unknown> {
    /** Returns Polish display label for field */
    label?: () => string;
    /** Output formatter for displaying field value (tables, details) */
    fieldOutput?: FieldOutputFn<TValue>;
    /** Input component for editing field value (undefined = readonly) */
    fieldInput?: FieldInputFn;
    /** Hide from tables/forms */
    hidden?: boolean;
    /** Allow sorting by this field (default: true, false for relation fields) */
    sortable?: boolean;
}

/** Generic field registry type */
export type FieldRegistry<TRow = Record<string, unknown>> = {
    [K in keyof TRow]?: FieldConfig<TRow[K]>;
};