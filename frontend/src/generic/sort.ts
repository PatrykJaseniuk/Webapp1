import { useState } from 'react';

export type SortDirection = 'asc' | 'desc';

export type SortConfig<C extends string> = {
  readonly column: C;
  readonly direction: SortDirection;
};

/**
 * Manages server-side sort state for table components.
 * Returns a tuple of [current config, toggle handler].
 *
 * @param defaultColumn  The column name to sort by on initial render.
 * @param defaultDirection  Initial direction ('asc' | 'desc').
 *
 * Toggle behaviour:
 *   - clicking the active column flips asc ↔ desc
 *   - clicking a new column sets it to asc
 */
export const useSort = <C extends string>(
  defaultColumn: C,
  defaultDirection: SortDirection,
): readonly [SortConfig<C>, (column: C) => void] => {
  const [sortConfig, setSortConfig] = useState<SortConfig<C>>({
    column: defaultColumn,
    direction: defaultDirection,
  });

  const doSort = (column: C): void => {
    setSortConfig((prev) =>
      prev.column === column ?
        { column, direction: prev.direction === 'asc' ? 'desc' : 'asc' } :
        { column, direction: 'asc' },
    );
  };

  return [sortConfig, doSort];
};