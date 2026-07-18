import { Link } from "@tanstack/react-router";
import { NotFound } from "@/slaveComponents/NotFoundS";

const loginLink = <Link to="/login" className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Go to login</Link>;

export const NotFoundPage = (): JSX.Element => <NotFound loginLink={loginLink} />;