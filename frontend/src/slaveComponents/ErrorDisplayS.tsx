import type { ReactNode } from "react";

type Props = {
  readonly is404: boolean;
  readonly loginLink: ReactNode;
};

export const ErrorDisplay = ({ is404, loginLink }: Props): JSX.Element =>
  is404 ?
    (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-6xl font-bold text-gray-500">404</h1>
        <h2 className="text-xl font-semibold text-gray-700">Page not found</h2>
        <p className="text-gray-500">The page you are looking for does not exist or has been moved.</p>
        {loginLink}
      </div>
    ) :
    (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold text-red-600">Something went wrong</h1>
        <p className="text-gray-600">An unexpected error occurred. Please try again later.</p>
        {loginLink}
      </div>
    );