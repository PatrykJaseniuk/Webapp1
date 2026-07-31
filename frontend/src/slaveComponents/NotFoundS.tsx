import type { CSSProperties, ReactNode } from "react";

type NavLink = (args: {
  readonly style: CSSProperties;
  readonly content: string;
}) => ReactNode;

type Props = {
  readonly navLinkTo: { readonly login: NavLink };
};

export const NotFound = ({ navLinkTo }: Props): JSX.Element => (
  <div className="flex h-screen flex-col items-center justify-center gap-4">
    <h1 className="text-6xl font-bold text-gray-500">404</h1>
    <h2 className="text-xl font-semibold text-gray-700">Page not found</h2>
    <p className="text-gray-500">The page you are looking for does not exist or has been moved.</p>
    {navLinkTo.login({ content: "Go to login", style: {} })}
  </div>
);
