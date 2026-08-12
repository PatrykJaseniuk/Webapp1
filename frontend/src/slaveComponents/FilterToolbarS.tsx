import { useEffect, useRef, useState } from 'react';
import { chipClass, chipRemoveClass, type FilterChip } from './filter';

const FILTER_ICON = (
  <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M1.5 2.75a.75.75 0 01.75-.75h11.5a.75.75 0 010 1.5H2.25a.75.75 0 01-.75-.75zM3.5 7.25a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM5.5 11.75a.75.75 0 01.75-.75h3.5a.75.75 0 010 1.5h-3.5a.75.75 0 01-.75-.75z" />
  </svg>
);

const popoverClosed = 'opacity-0 scale-95 pointer-events-none -translate-y-1';
const popoverOpen = 'opacity-100 scale-100 pointer-events-auto translate-y-0';

type FilterToolbarSProps = {
  readonly isFilterActive: boolean;
  readonly activeFilterCount: number;
  readonly clearFilter: () => void;
  readonly chips: readonly FilterChip[];
  readonly resultCount: string | null;
  readonly filterResetKey: number;
  readonly clearLabel?: string;
  readonly panel: JSX.Element;
};

export const FilterToolbarS = ({
  isFilterActive,
  activeFilterCount,
  clearFilter,
  chips,
  resultCount,
  filterResetKey,
  clearLabel = 'Wyczyść',
  panel,
}: FilterToolbarSProps): JSX.Element => {
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent): void => {
      const target = e.target as Node | null;
      const inside = toolbarRef.current?.contains(target) ?? false;
      !inside ? setShowFilterPanel(false) : undefined;
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={toolbarRef} className="relative mb-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setShowFilterPanel((prev) => !prev)}
          aria-expanded={showFilterPanel}
          className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium shadow-sm transition-colors ${
            isFilterActive ?
              'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100' :
              'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          {FILTER_ICON}
          Filtry{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
        </button>
        {chips.map((chip) => (
          <span key={chip.key} className={chipClass}>
            {chip.label}
            <button type="button" onClick={chip.onRemove} className={chipRemoveClass} aria-label={`Usuń filtr: ${chip.label}`}>
              ×
            </button>
          </span>
        ))}
        {isFilterActive ? (
          <button type="button" onClick={clearFilter} className="text-xs font-medium text-gray-500 underline hover:text-gray-700">
            {clearLabel}
          </button>
        ) : null}
        {resultCount !== null ? (
          <span className="ml-auto text-sm text-gray-500">{resultCount}</span>
        ) : null}
      </div>
      <div
        className={`absolute left-0 top-full z-20 mt-1 flex flex-wrap items-end gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-lg transition-all duration-200 ${showFilterPanel ? popoverOpen : popoverClosed}`}
        key={filterResetKey}
      >
        {panel}
      </div>
    </div>
  );
};