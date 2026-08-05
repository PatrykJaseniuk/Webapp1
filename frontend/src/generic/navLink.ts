import type { CSSProperties, ReactNode } from 'react';

export type NavLink = (args: {
  readonly style: CSSProperties;
  readonly content: string;
}) => ReactNode;

export type NavLinkWithId = (args: {
  readonly id: string;
  readonly style: CSSProperties;
  readonly content: string;
  readonly ariaLabel?: string;
}) => ReactNode;