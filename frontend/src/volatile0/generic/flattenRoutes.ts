import type { ComponentType } from 'react';

// ── Route tree flattening utility ──
// Pure function: hierarchical RouteNode tree → flat Record<string, FlatRouteEntry>
// Generic over the role type — no framework dependencies, no I/O.
// Segment is always the key name. Every node (with or without children) gets a flat entry.

// ── Sentinel for "inherit parent's allowedRoles" ──
export const INHERIT: unique symbol = Symbol('INHERIT');

export type InheritSentinel = typeof INHERIT;

// ── Tree node (input) ──
export type RouteNode<TRole extends string = string> = Readonly<{
  allowedRoles: readonly TRole[] | InheritSentinel;
  navLabel?: string;
  element?: ComponentType;
  children?: Readonly<Record<string, RouteNode<TRole>>>;
}>;

// ── Flat entry (output) ──
export type FlatRouteEntry<TRole extends string = string> = Readonly<{
  path: string;
  allowedRoles: readonly TRole[];
  navLabel?: string;
  element?: ComponentType;
}>;

// ── Build full path from parent + segment ──
const buildPath = (parentPath: string, segment: string): string =>
  segment.startsWith('/') ?
    segment :
    `${parentPath}/${segment}`;

// ── Flatten tree into dot-joined keys ──
export const flattenRoutes = <TRole extends string>(
  root: RouteNode<TRole>,
  parentPath = '',
  parentRoles: readonly TRole[] = [],
  prefix = '',
): Record<string, FlatRouteEntry<TRole>> => {
  const children = root.children;
  const childrenEntries = children !== undefined ?
    Object.entries(children) :
    [];

  return childrenEntries.reduce<Record<string, FlatRouteEntry<TRole>>>(
    (acc, [key, node]) => {
      const fullKey = prefix !== '' ? `${prefix}.${key}` : key;
      const resolvedRoles: readonly TRole[] =
        node.allowedRoles === INHERIT ? parentRoles : node.allowedRoles;
      const fullPath = buildPath(parentPath, key);
      const entry: FlatRouteEntry<TRole> = {
        path: fullPath,
        allowedRoles: resolvedRoles,
        ...(node.navLabel !== undefined ?
          { navLabel: node.navLabel } :
          {}),
        ...(node.element !== undefined ?
          { element: node.element } :
          {}),
      };
      const childrenResult = flattenRoutes(
        node,
        fullPath,
        resolvedRoles,
        fullKey,
      );

      return {
        ...acc,
        [fullKey]: entry,
        ...childrenResult,
      };
    },
    {},
  );
};