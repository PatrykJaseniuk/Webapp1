import { isRouteErrorResponse, useRouteError, Link } from "react-router-dom";

export const ErrorDisplay = (): JSX.Element => {
  const error = useRouteError();

  return isRouteErrorResponse(error) && error.status === 404 ?
    (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-6xl font-bold text-gray-300">404</h1>
        <h2 className="text-xl font-semibold text-gray-700">Page not found</h2>
        <p className="text-gray-500">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link to="/login" className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          Go to login
        </Link>
      </div>
    ) :
    (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold text-red-600">Something went wrong</h1>
        <p className="text-gray-600">
          An unexpected error occurred. Please try again later.
        </p>
        <Link to="/login" className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          Go to login
        </Link>
      </div>
    );
};