export const SortIcon = ({ direction }: { readonly direction: 'asc' | 'desc' | null }): JSX.Element => (
  <svg
    className={`ml-1 inline-block h-3 w-3 transition-opacity ${
      direction === null ?
        'opacity-30 group-hover:opacity-60 group-focus-visible:opacity-60' :
        'text-blue-600 opacity-100'
    } ${direction === 'desc' ? 'rotate-180' : ''}`}
    viewBox="0 0 12 12"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M6 3l4.5 6h-9z" />
  </svg>
);