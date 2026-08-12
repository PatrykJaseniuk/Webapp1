import type { ChangeEvent } from 'react';
import type { Pagination } from './DataTableS';

export const inputClass =
  'rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

export const labelClass = 'block text-xs font-medium text-gray-600 mb-1';

export const chipClass =
  'inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700';

export const chipRemoveClass =
  'ml-0.5 inline-flex h-4 w-4 cursor-pointer items-center justify-center rounded-full text-blue-500 hover:bg-blue-200 hover:text-blue-800';

export type FilterChip = {
  readonly key: string;
  readonly label: string;
  readonly onRemove: () => void;
};

type PaginationLike = {
  readonly page: number;
  readonly pageSize: number;
  readonly goToPage: (n: number) => void;
  readonly prevPage: () => void;
  readonly nextPage: () => void;
};

export const toPagination = (
  pagination: PaginationLike,
  totalCount: number | undefined,
): Pagination | undefined =>
  totalCount === undefined ?
    undefined :
    {
      page: pagination.page,
      pageSize: pagination.pageSize,
      goToPage: pagination.goToPage,
      prevPage: pagination.prevPage,
      nextPage: pagination.nextPage,
    };

export const onFilterInput = (
  onChange: (text: string) => void,
): ((e: ChangeEvent<HTMLInputElement>) => void) =>
  (e: ChangeEvent<HTMLInputElement>): void => {
    onChange(e.target.value);
  };

export const onSelectInput = (
  onChange: (value: string) => void,
): ((e: ChangeEvent<HTMLSelectElement>) => void) =>
  (e: ChangeEvent<HTMLSelectElement>): void => {
    onChange(e.target.value);
  };

export const optionEntries = <K extends string>(
  map: Readonly<Record<K, string>>,
): readonly (readonly [K, string])[] =>
  Object.entries(map) as unknown as readonly (readonly [K, string])[];
