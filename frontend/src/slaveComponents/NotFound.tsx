import { Link } from "react-router-dom";

export const NotFound = (): JSX.Element => (
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
);