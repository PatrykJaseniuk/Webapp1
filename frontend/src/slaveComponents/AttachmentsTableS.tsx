import type { AsyncData } from '@/generic';
import { AsyncStateTableS } from './AsyncStateTableS';
import type { ColumnDef } from './DataTableS';

type AttachmentRow = {
  readonly id: string;
  readonly file_name: string;
  readonly file_url: string;
  readonly description: string | null;
  readonly file_type: string | null;
  readonly file_size: number | null;
};

type SortColumn = 'created_at';

const COLUMNS: readonly ColumnDef<SortColumn>[] = [
  { key: 'file_name', label: 'Nazwa pliku', sortColumn: null, align: 'left', className: 'pl-4 pr-4' },
  { key: 'description', label: 'Opis', sortColumn: null, align: 'left', className: 'pr-4' },
  { key: 'meta', label: 'Typ / rozmiar', sortColumn: null, align: 'right', className: 'pr-4' },
];

const skeletonBar = 'h-4 animate-pulse rounded bg-gray-200';

const SKELETON_ROWS = (
  <>
    {Array.from({ length: 4 }, (_, i) => (
      <tr key={`attachment-skel-${i}`} className="border-b border-gray-100">
        <td className="pl-4 h-12 py-0 pr-4"><div className={`${skeletonBar} w-40`} /></td>
        <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} w-32`} /></td>
        <td className="h-12 py-0 pr-4"><div className={`${skeletonBar} ml-auto w-16`} /></td>
      </tr>
    ))}
  </>
);

const renderRow = (a: AttachmentRow): JSX.Element => (
  <tr key={a.id} className="border-b border-gray-100 text-sm hover:bg-gray-50">
    <td className="pl-4 h-12 py-0 pr-4">
      <a
        href={a.file_url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 hover:underline"
      >
        {a.file_name}
      </a>
    </td>
    <td className="h-12 py-0 pr-4 text-gray-600">{a.description ?? '—'}</td>
    <td className="h-12 py-0 pr-4 text-right text-xs text-gray-400">
      {a.file_type ?? 'inny'}{a.file_size !== null ? ` · ${(a.file_size / 1024).toFixed(0)} KB` : ''}
    </td>
  </tr>
);

type AttachmentsTableSProps = {
  readonly asyncData: AsyncData<{ readonly rows: readonly AttachmentRow[]; readonly totalCount: number }>;
  readonly sort: {
    readonly config: { readonly column: SortColumn; readonly direction: 'asc' | 'desc' };
    readonly doSort: (column: SortColumn) => void;
  };
  readonly pagination: {
    readonly page: number;
    readonly pageSize: number;
    readonly goToPage: (n: number) => void;
    readonly setPageSize: (size: number) => void;
    readonly prevPage: () => void;
    readonly nextPage: () => void;
  };
  readonly emptyMessage: string;
};

export const AttachmentsTableS = ({
  asyncData,
  sort,
  pagination,
  emptyMessage,
}: AttachmentsTableSProps): JSX.Element => (
  <AsyncStateTableS<AttachmentRow, SortColumn>
    asyncData={asyncData}
    columns={COLUMNS}
    sort={sort}
    pagination={pagination}
    skeletonRows={SKELETON_ROWS}
    emptyState={<p className="text-sm text-gray-500">{emptyMessage}</p>}
    filteredEmptyState={<p className="text-sm text-gray-500">{emptyMessage}</p>}
    isFilterActive={false}
    maxHeight={null}
    pageSizeOptions={[5, 20, 50, 100]}
    renderRow={renderRow}
  />
);