import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { match } from 'ts-pattern';
import { backendConnector } from '@/volatile0/infra/backendConnector';
import type { AppRole, AuthState } from '@/volatile1/domain';

// ── Context shape ──

type AuthContextValue = AuthState;

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

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
            const { data: roleRow } = await backendConnector
              .from('user_roles')
              .select('role')
              .eq('user_id', user.id)
              .maybeSingle();

            const role: AppRole =
              roleRow?.role === 'admin' || roleRow?.role === 'landlord' ?
                roleRow.role :
                'tenant';

            return {
              tag: 'authenticated',
              userId: user.id,
              email: user.email ?? '',
              role,
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

// ── Role-check helper ──

export const useRequireRole = (
  allowedRoles: readonly AppRole[],
): boolean => {
  const authState = useAuth();

  return match(authState)
    .with({ tag: 'loading' }, () => false)
    .with({ tag: 'unauthenticated' }, () => false)
    .with({ tag: 'authenticated' }, ({ role }) => allowedRoles.includes(role))
    .exhaustive();
};