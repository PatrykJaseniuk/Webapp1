export const inputClass =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

export const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

export const buttonClass =
  'w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50';

export const FormErrorS = ({ message }: { readonly message: string }): JSX.Element => (
  <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{message}</div>
);