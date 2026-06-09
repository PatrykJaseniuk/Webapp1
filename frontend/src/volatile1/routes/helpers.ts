import type { ComponentType } from 'react';
import type { AppRole } from '@/volatile1/domain';

// ══════════════════════════════════════════════════════════════
// Sentinel & types
// ══════════════════════════════════════════════════════════════

const INHERIT_SENTINEL = '__INHERIT__' as const;

export type InheritSentinel = typeof INHERIT_SENTINEL;

export type RouteNode<TRole extends string = string> = Readonly<{
  allowedRoles: readonly TRole[] | InheritSentinel;
  navLabel?: string;
  element?: ComponentType<any>;
  /** Jawne nazwy parametrów URL (np. ['tenantId'] → segment :tenantId). Puste/brak = statyczny. */
  args?: ReadonlyArray<string>;
  children?: Readonly<Record<string, RouteNode<TRole>>>;
}>;

export const INHERIT: InheritSentinel = INHERIT_SENTINEL;

export const buildPath = (parent: string, segment: string): string =>
  segment.startsWith('/') ? segment : `${parent}/${segment}`;

export const resolveRoles = <TRole extends string>(
  node: RouteNode<TRole>,
  parentRoles: readonly TRole[],
): readonly TRole[] =>
  node.allowedRoles === INHERIT_SENTINEL ? parentRoles : node.allowedRoles;

// ══════════════════════════════════════════════════════════════
// Type-safe node builders
// ══════════════════════════════════════════════════════════════

/** Węzeł z parametrami — TS sprawdza zgodność `args` z propsami `element`. */
export const route = <const A extends ReadonlyArray<string>>(config: {
  readonly allowedRoles: readonly AppRole[] | InheritSentinel;
  readonly navLabel?: string;
  readonly element: ComponentType<Record<A[number], string>>;
  readonly args: A;
  readonly children?: Readonly<Record<string, RouteNode<AppRole>>>;
}): RouteNode<AppRole> =>
  config as unknown as RouteNode<AppRole>;

/** Węzeł statyczny (bez parametrów URL). */
export const routeStatic = (config: {
  readonly allowedRoles: readonly AppRole[] | InheritSentinel;
  readonly navLabel?: string;
  readonly element?: ComponentType;
  readonly children?: Readonly<Record<string, RouteNode<AppRole>>>;
}): RouteNode<AppRole> => config;