'use client';
import type React from 'react';

export type FieldRenderMode = 'read' | 'edit';

export type FieldRenderContext = 'details' | 'table';

export interface FieldRendererProps {
    value: unknown;
    mode: FieldRenderMode;
    context: FieldRenderContext;
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
