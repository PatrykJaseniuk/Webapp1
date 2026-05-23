'use client';
import type React from 'react';

// ── Field Renderer Types ──────────────────────────────────────────
interface FieldRendererProps {
    value: unknown;
    mode: 'read' | 'edit';
    context: 'details' | 'table';
    fieldKey: string;
    onChange?: (value: unknown) => void;
}

export type FieldRendererFn = (
    props: Readonly<FieldRendererProps>,
) => React.ReactNode;

export interface FieldConfig {
    label: string;
    fieldRenderer?: FieldRendererFn;
    isHidden?: boolean;
    isSortable?: boolean;
}