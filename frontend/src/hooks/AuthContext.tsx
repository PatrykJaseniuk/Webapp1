import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { jwtDecode } from 'jwt-decode';
import { backendConnector } from '@/backendConnector/backendConnector';
import type { Database } from '@/backendConnector';

export type AppRole = Database['public']['Enums']['app_role'];

export type AuthState =
  | { readonly tag: 'authenticated'; readonly userId: string; readonly email: string; readonly role: AppRole }
  | { readonly tag: 'unauthenticated' }
  | { readonly tag: 'loading' };

// ── JWT claims shape ──

type JwtClaims = {
  readonly user_role?: AppRole;
} & Record<string, unknown>;

// ── Session shape (subset we care about) ──

export type SessionLike = {
  readonly user: { readonly id: string; readonly email?: string | null };
  readonly access_token: string;
};

// ── Pure: session → AuthState ──

export const parseSession = (session: SessionLike | null): AuthState =>
  session === null ?
    { tag: 'unauthenticated' } :
    (() => {
      const claims = jwtDecode<JwtClaims>(session.access_token);
      const appRole: AppRole =
        claims.user_role === 'admin' || claims.user_role === 'landlord' ?
          claims.user_role :
          'tenant';

      return {
        tag: 'authenticated',
        userId: session.user.id,
        email: session.user.email ?? '',
        role: appRole,
      };
    })();

// ── Context + Provider ──

const AuthContext = createContext<AuthState | undefined>(undefined);

type Props = {
  readonly children: ReactNode;
};

export const AuthProvider = ({ children }: Props): JSX.Element => {
  const [authState, setAuthState] = useState<AuthState>({ tag: 'loading' });

  useEffect(() => {
    const fetchAuth = (): void => {
      void backendConnector.auth.getSession().then(({ data }) => {
        const session = data.session ?? null;
        const sessionLike: SessionLike | null =
          session !== null ?
            {
              user: { id: session.user.id, email: session.user.email },
              access_token: session.access_token,
            } :
            null;

        setAuthState(parseSession(sessionLike));
      });
    };

    fetchAuth();

    const { data: listener } = backendConnector.auth.onAuthStateChange(() => {
      fetchAuth();
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={authState}>{children}</AuthContext.Provider>
  );
};

// ── Hook ──

export const useAuth = (): AuthState => {
  const ctx = useContext(AuthContext);
  return ctx !== undefined ? ctx : { tag: 'loading' };
};

