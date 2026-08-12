export const SEARCH_ICON_PATH =
  'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z';

type EmptyStateAction = {
  readonly label: string;
  readonly onClick: () => void;
};

type EmptyStateSProps = {
  readonly iconPath: string;
  readonly title: string;
  readonly description: string;
  readonly action?: EmptyStateAction;
};

export const EmptyStateS = ({ iconPath, title, description, action }: EmptyStateSProps): JSX.Element => (
  <>
    <svg className="mx-auto mb-3 h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={iconPath} />
    </svg>
    <p className="text-sm font-medium text-gray-600">{title}</p>
    <p className="mt-1 text-xs text-gray-500">
      {description}
      {action !== undefined ? (
        <>
          {' '}
          <button type="button" onClick={action.onClick} className="text-blue-600 underline hover:text-blue-800">
            {action.label}
          </button>
        </>
      ) : null}
    </p>
  </>
);

type FilterEmptyStateSProps = {
  readonly clearFilter: () => void;
};

export const FilterEmptyStateS = ({ clearFilter }: FilterEmptyStateSProps): JSX.Element => (
  <EmptyStateS
    iconPath={SEARCH_ICON_PATH}
    title="Brak wyników dla wybranych filtrów"
    description="Spróbuj zmienić kryteria wyszukiwania lub"
    action={{ label: 'wyczyść filtry', onClick: clearFilter }}
  />
);