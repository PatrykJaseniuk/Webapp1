import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { jwtDecode } from 'jwt-decode';
import { backendConnector } from '@/backendConnector/backendConnector';
import { Database } from '@/backendConnector';

export type AppRole = Database['public']['Enums']['app_role']

export type AuthState =
  { readonly tag: "authenticated", readonly userId: string, readonly email: string, readonly role: AppRole } |
  { readonly tag: "unauthenticated" } |
  { readonly tag: "loading" }

type JwtClaims = {
  readonly user_role?: AppRole;
} & Record<string, unknown>;


const AuthContext = createContext<AuthState | undefined>(undefined);

// ── Provider ──

type Props = {
  readonly children: ReactNode;
};

export const AuthProvider = ({ children }: Props): JSX.Element => {
  const [authState, setAuthState] = useState<AuthState>({ tag: 'loading' });

  useEffect(() => {
    const fetchAuth = (): void => {
      void backendConnector.auth.getSession().then(({ data }) => {
        const user = data.session?.user;

        const next: AuthState =
          user !== undefined ?
            (() => {
              const claims = jwtDecode<JwtClaims>(data.session!.access_token);
              const appRole: AppRole =
                claims.user_role === 'admin' || claims.user_role === 'landlord' ?
                  claims.user_role :
                  'tenant';

              return {
                tag: 'authenticated',
                userId: user.id,
                email: user.email ?? '',
                role: appRole,
              };
            })() :
            { tag: 'unauthenticated' };

        setAuthState(next);
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

