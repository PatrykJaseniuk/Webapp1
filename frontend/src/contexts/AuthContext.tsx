import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { backendConnector } from '@/backendConnector/backendConnector';
import { Database } from '@/backendConnector';

export type AppRole = Database['public']['Enums']['app_role']

type AuthState =
  { readonly tag: "authenticated", readonly userId: string, readonly email: string, readonly role: AppRole } |
  { readonly tag: "unauthenticated" } |
  { readonly tag: "loading" }


const AuthContext = createContext<AuthState | undefined>(undefined);

// ── Provider ──

type Props = {
  readonly children: ReactNode;
};

export const AuthProvider = ({ children }: Props): JSX.Element => {
  const [authState, setAuthState] = useState<AuthState>({ tag: 'loading' });

  useEffect(() => {
    const fetchAuth = async (): Promise<void> => {
      const { data } = await backendConnector.auth.getSession();
      const user = data.session?.user;

      const next: AuthState =
        user !== undefined ?
          await (async (): Promise<AuthState> => {
            const { data: role } = await backendConnector
              .rpc('get_user_role')
              .maybeSingle();

            const appRole: AppRole =
              role === 'admin' || role === 'landlord' ?
                role :
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

