import { useRouteError, isRouteErrorResponse } from "react-router-dom";
import { ErrorDisplay } from "@/slaveComponents/ErrorDisplay";

export const ErrorPage = (): JSX.Element => {
  const error = useRouteError();
  const is404 = isRouteErrorResponse(error) && error.status === 404;

  return <ErrorDisplay is404={is404} />;
};
