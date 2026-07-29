import { ErrorDisplayM } from "@/masterComponents/ErrorDisplayM";
import { ErrorDisplay } from "@/slaveComponents/ErrorDisplayS";

type ErrorProps = {
  readonly error: Error;
};

export const ErrorPage = ({ error }: ErrorProps): JSX.Element => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  const is404 = message.toLowerCase().includes('not found') || message.includes('404');
  return <ErrorDisplayM Slave={ErrorDisplay} is404={is404} />;
};
