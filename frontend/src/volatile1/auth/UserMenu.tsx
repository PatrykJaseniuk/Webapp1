import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { match } from 'ts-pattern';
import { backendConnector } from '@/volatile0/infra/backendConnector';
import { link } from '@/volatile1/routes';
import { useAuth } from './AuthContext';
import type { AppRole } from '@/volatile1/domain';

const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'Administrator',
  landlord: 'Wynajmujący',
  tenant: 'Najemca',
};

export const UserMenu = (): JSX.Element => {
  const authState = useAuth();
  const navigate = useNavigate();

  const handleLogout = useCallback((): void => {
    backendConnector.auth
      .signOut()
      .then(() => navigate((link.login as unknown as { readonly gen: () => string }).gen()));
  }, [navigate]);

  return match(authState)
    .with({ tag: 'authenticated' }, ({ email, role }) => (
      <div className="border-t border-gray-200 pt-4">
        <div className="mb-2">
          <p className="text-sm font-medium text-gray-900 truncate">{email}</p>
          <p className="text-xs text-gray-500">
            {ROLE_LABELS[role] ?? role}
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-md bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-300 transition-colors"
        >
          Wyloguj
        </button>
      </div>
    ))
    .otherwise(() => <></>);
};