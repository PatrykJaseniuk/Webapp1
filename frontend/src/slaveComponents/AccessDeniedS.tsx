import type { ReactNode } from "react";

type Props = {
  readonly loginLink: ReactNode;
};

export const AccessDenied = ({ loginLink }: Props): JSX.Element => (
  <div className="flex h-screen flex-col items-center justify-center gap-4">
    <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
    <p className="text-gray-600">
      You do not have permission to view this page.
    </p>
    {loginLink}
  </div>
);