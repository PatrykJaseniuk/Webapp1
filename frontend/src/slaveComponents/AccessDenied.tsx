import { Link } from "react-router-dom";

export const AccessDenied = (): JSX.Element => (
  <div className="flex h-screen flex-col items-center justify-center gap-4">
    <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
    <p className="text-gray-600">
      You do not have permission to view this page.
    </p>
    <Link to="/login" className="text-blue-600 underline">
      Go to login
    </Link>
  </div>
);