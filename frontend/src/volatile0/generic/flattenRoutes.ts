// ── Route tree flattening utility ──
// Pure function: hierarchical RouteNode tree → flat Record<string, FlatRouteEntry>
// Generic over the role type — no framework dependencies, no I/O.

// ── Sentinel for "inherit parent's allowedRoles" ──
export const INHERIT: unique symbol = Symbol('INHERIT');

export type InheritSentinel = typeof INHERIT;

// ── Tree node (input) ──
export type RouteNode<TRole extends string = string> = Readonly<{
  path: string;
  allowedRoles: readonly TRole[] | InheritSentinel;
  navLabel?: string;
  children?: Readonly<Record<string, RouteNode<TRole>>>;
}>;

// ── Flat entry (output) ──
export type FlatRouteEntry<TRole extends string = string> = Readonly<{
  path: string;
  allowedRoles: readonly TRole[];
  navLabel?: string;
}>;

// ── Flatten tree into dot-joined keys ──
export const flattenRoutes = <TRole extends string>(
  tree: Record<string, RouteNode<TRole>>,
  parentPath = '',
  parentRoles: readonly TRole[] = [],
  prefix = '',
): Record<string, FlatRouteEntry<TRole>> => {
  const result: Record<string, FlatRouteEntry<TRole>> = {};

  for (const [key, node] of Object.entries(tree)) {
    const fullKey = prefix !== '' ? `${prefix}.${key}` : key;
    const resolvedRoles: readonly TRole[] =
      node.allowedRoles === INHERIT ? parentRoles : node.allowedRoles;
    const fullPath =
      parentPath !== '' && node.path !== '' ?
        `${parentPath}/${node.path}` :
        parentPath !== '' ?
          parentPath :
          node.path;
    const hasChildren = node.children !== undefined;

    if (!hasChildren) {
      result[fullKey] = {
        path: fullPath,
        allowedRoles: resolvedRoles,
        ...(node.navLabel !== undefined ?
          { navLabel: node.navLabel } :
          {}),
      };
    }

    if (hasChildren) {
      Object.assign(
        result,
        flattenRoutes(node.children, fullPath, resolvedRoles, fullKey),
      );
    }
  }

  return result;
};