'use client';
import { useSearchParams } from 'next/navigation';

export const useRouteParams = <T extends Record<string, string | undefined>>(): T => {
    const searchParams = useSearchParams();
    return new Proxy({} as T, {
        get: (_, prop: string) => searchParams.get(prop) ?? undefined,
    });

};
