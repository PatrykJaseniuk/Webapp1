export const LoadingSpinner = (): JSX.Element => (
  <div className="flex items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    <span className="ml-3 text-gray-500">Loading…</span>
  </div>
);
