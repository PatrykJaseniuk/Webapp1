'use client';

import { useSearchParams } from 'next/navigation';

/**
 * Type-safe wrapper around useSearchParams().
 * Returns a Proxy that reads search params with proper typing.
 *
 * Usage:
 *   const { id, action } = useRouteParams<PropertyRouteParams>();
 */
export const useRouteParams = <T extends Record<string, string | undefined>>(): T => {
    const searchParams = useSearchParams();

    return new Proxy({} as T, {
        get: (_, prop: string) => searchParams.get(prop) ?? undefined,
    });
};
