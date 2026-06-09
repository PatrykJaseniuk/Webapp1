import type { ComponentType } from 'react';
import { useParams } from 'react-router-dom';

const stripColon = (key: string): string =>
  key.startsWith(':') ? key.slice(1) : key;

export const withRouteParams =
  <P extends Record<string, string>>(Component: ComponentType<P>): ComponentType =>
  () => {
    const raw = useParams<Record<string, string>>();
    const props = Object.fromEntries(
      Object.entries(raw).map(([k, v]) => [stripColon(k), v]),
    ) as P;
    return <Component {...props} />;
  };