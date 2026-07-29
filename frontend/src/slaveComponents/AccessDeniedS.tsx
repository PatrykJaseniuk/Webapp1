import type { NavLink } from "@/generic/utils";

type Props = {
  readonly navLinkTo: { readonly login: NavLink };
};

export const AccessDeniedS = ({ navLinkTo }: Props): JSX.Element => (
  <div className="flex h-screen flex-col items-center justify-center gap-4">
    <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
    <p className="text-gray-600">
      You do not have permission to view this page.
    </p>
    {navLinkTo.login({ content: "Go to login", style: {} })}
  </div>
);
