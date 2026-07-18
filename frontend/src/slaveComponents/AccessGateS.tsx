import { Link } from '@tanstack/react-router';
import { match } from 'ts-pattern';
import type { AccessGateSlaveProps, AuthorisationResult } from '@/masterComponents/RoleGuardM';
import type { ReactNode } from 'react';
import { LoadingSpinner } from './LoadingSpinnerS';
import { ErrorMessage } from './ErrorMessageS';
import { AccessDenied } from './AccessDeniedS';

const loginLink = <Link to="/login" className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Go to login</Link>;

const GateContent = ({
  authData,
  children,
}: {
  readonly authData: AuthorisationResult;
  readonly children: ReactNode;
}): JSX.Element =>
  authData.isAuthorised ?
    <>{children}</> :
    <AccessDenied loginLink={loginLink} />;

export const AccessGateS = ({
  asyncData,
  children,
}: AccessGateSlaveProps): JSX.Element => (
  <div className="min-h-[300px]">
    {match(asyncData)
      .with({ tag: 'pending' }, () => <LoadingSpinner />)
      .with({ tag: 'rejected' }, ({ message, onRetry }) => (
        <ErrorMessage message={message} onRetry={onRetry} />
      ))
      .with({ tag: 'fulfilled' }, ({ data }) => (
        <GateContent authData={data}>{children}</GateContent>
      ))
      .exhaustive()}
  </div>
);