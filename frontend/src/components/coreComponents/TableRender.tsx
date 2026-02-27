'use client';
import { resolveFieldConfig, type FieldConfig } from '@/components/fieldRegistry';
import { EmptyState } from '@/components/coreComponents/EmptyState';
import styles from '@/components/styles/shared.module.css';

// ── Types ───────────────────────────────────────────────────────────

interface FieldOverride extends Partial<FieldConfig> {
    key: string;
}

interface TableRenderProps {
    /** Table name for field config resolution (deprecated, kept for backwards compatibility) */
    tableName?: string;
    /** Pre-loaded data rows */
    rows: Record<string, unknown>[];
    /** Field customization */
    columns?: FieldOverride[];
    /** Fields to hide */
    hiddenColumns?: string[];
    /** Current sort field */
    sortKey?: string | null;
    /** Sort direction */
    sortDirection?: 'asc' | 'desc';
    /** Sort callback */
    onSort?: (key: string) => void;
    /** Row click handler */
    onRowClick?: (row: Record<string, unknown>) => void;
    /** Message when no rows */
    emptyMessage?: string;
}

interface ResolvedField {
    key: string;
    config: FieldConfig;
}

// ── Helpers ─────────────────────────────────────────────────────────

const resolveFields = (
    keys: string[],
    hiddenColumns: string[],
    fieldOverrides: FieldOverride[],
): ResolvedField[] => {
    const overrideMap = Object.fromEntries(
        fieldOverrides.map((f) => [f.key, f]),
    );

    return keys
        .map((key) => {
            const override = overrideMap[key];
            const { key: _, ...overrideConfig } = override ?? { key };
            const config = resolveFieldConfig(key, overrideConfig);
            return { key, config };
        })
        .filter((field) => !field.config.hidden && !hiddenColumns.includes(field.key));
};

const renderCellValue = (field: ResolvedField, value: unknown, row: Record<string, unknown>): React.ReactNode =>
    field.config.fieldOutput
        ? field.config.fieldOutput(value, row)
        : value == null
            ? '—'
            : String(value);

const getFieldLabel = (field: ResolvedField): string =>
    field.config.label ?? field.key;

// ── TableRender Component ───────────────────────────────────────────

export const TableRender = ({
    tableName: _tableName,
    rows,
    columns: fieldOverrides = [],
    hiddenColumns = [],
    sortKey = null,
    sortDirection = 'asc',
    onSort,
    onRowClick,
    emptyMessage = 'Brak danych',
}: TableRenderProps) => {
    // Handle empty state
    if (rows.length === 0) {
        return <EmptyState message={emptyMessage} />;
    }

    // Resolve fields from data keys
    const fieldKeys = Object.keys(rows[0]);
    const resolvedFields = resolveFields(fieldKeys, hiddenColumns, fieldOverrides);

    const handleHeaderClick = (key: string) => {
        if (onSort) {
            onSort(key);
        }
    };

    return (
        <table className={styles.table}>
            <thead className={styles.tableHeader}>
                <tr>
                    {resolvedFields.map((field) => (
                        <th
                            key={field.key}
                            scope="col"
                            className={`${styles.tableHeaderCell} ${onSort ? styles.tableHeaderCellSortable : ''}`}
                            onClick={() => handleHeaderClick(field.key)}
                            aria-sort={
                                sortKey === field.key
                                    ? sortDirection === 'asc'
                                        ? 'ascending'
                                        : 'descending'
                                    : 'none'
                            }
                        >
                            {getFieldLabel(field)}
                            {sortKey === field.key ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {rows.map((row, index) => (
                    <tr
                        key={row.id as string ?? index}
                        className={`${styles.tableRow} ${onRowClick ? styles.tableRowClickable : ''}`}
                        onClick={onRowClick ? () => onRowClick(row) : undefined}
                        role={onRowClick ? 'button' : undefined}
                        tabIndex={onRowClick ? 0 : undefined}
                        onKeyDown={onRowClick ? (e) => (e.key === 'Enter' || e.key === ' ') && onRowClick(row) : undefined}
                    >
                        {resolvedFields.map((field) => (
                            <td key={field.key} className={styles.tableCell}>
                                {renderCellValue(field, row[field.key], row)}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
};