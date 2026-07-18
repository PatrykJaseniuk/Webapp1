import { Link } from "@tanstack/react-router";
import { ErrorDisplay } from "@/slaveComponents/ErrorDisplayS";

const loginLink = <Link to="/login" className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Go to login</Link>;

type ErrorProps = {
  readonly error: Error;
};

export const ErrorPage = ({ error }: ErrorProps): JSX.Element => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  const is404 = message.toLowerCase().includes('not found') || message.includes('404');
  return <ErrorDisplay is404={is404} loginLink={loginLink} />;
};