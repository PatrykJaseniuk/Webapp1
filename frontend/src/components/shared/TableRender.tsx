'use client';
import { resolveColumnConfig, type ColumnConfig } from '@/constants/columnRegistry';
import { EmptyState } from '@/components/shared/EmptyState';
import styles from '@/components/styles/shared.module.css';

// ── Types ───────────────────────────────────────────────────────────

interface ColumnOverride extends Partial<ColumnConfig> {
    key: string;
}

interface TableRenderProps {
    /** Table name for column config resolution (deprecated, kept for backwards compatibility) */
    tableName?: string;
    /** Pre-loaded data rows */
    rows: Record<string, unknown>[];
    /** Column customization */
    columns?: ColumnOverride[];
    /** Columns to hide */
    hiddenColumns?: string[];
    /** Current sort column */
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

interface ResolvedColumn {
    key: string;
    config: ColumnConfig;
}

// ── Helpers ─────────────────────────────────────────────────────────

const resolveColumns = (
    keys: string[],
    hiddenColumns: string[],
    columnOverrides: ColumnOverride[],
): ResolvedColumn[] => {
    const overrideMap = Object.fromEntries(
        columnOverrides.map((c) => [c.key, c]),
    );

    return keys
        .map((key) => {
            const override = overrideMap[key];
            const { key: _, ...overrideConfig } = override ?? { key };
            const config = resolveColumnConfig(key, overrideConfig);
            return { key, config };
        })
        .filter((col) => !col.config.hidden && !hiddenColumns.includes(col.key));
};

const renderCellValue = (col: ResolvedColumn, value: unknown, row: Record<string, unknown>): React.ReactNode =>
    col.config.cellRender
        ? col.config.cellRender(value, row)
        : value == null
            ? '—'
            : String(value);

const getColumnLabel = (col: ResolvedColumn): string =>
    col.config.labelRender
        ? col.config.labelRender()
        : col.key;

// ── TableRender Component ───────────────────────────────────────────

export const TableRender = ({
    tableName: _tableName,
    rows,
    columns: columnOverrides = [],
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

    // Resolve columns from data keys
    const columnKeys = Object.keys(rows[0]);
    const resolvedColumns = resolveColumns(columnKeys, hiddenColumns, columnOverrides);

    const handleHeaderClick = (key: string) => {
        if (onSort) {
            onSort(key);
        }
    };

    return (
        <table className={styles.table}>
            <thead className={styles.tableHeader}>
                <tr>
                    {resolvedColumns.map((col) => (
                        <th
                            key={col.key}
                            scope="col"
                            className={`${styles.tableHeaderCell} ${onSort ? styles.tableHeaderCellSortable : ''}`}
                            onClick={() => handleHeaderClick(col.key)}
                            aria-sort={
                                sortKey === col.key
                                    ? sortDirection === 'asc'
                                        ? 'ascending'
                                        : 'descending'
                                    : 'none'
                            }
                        >
                            {getColumnLabel(col)}
                            {sortKey === col.key ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
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
                        {resolvedColumns.map((col) => (
                            <td key={col.key} className={styles.tableCell}>
                                {renderCellValue(col, row[col.key], row)}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
};