import type { User } from '@supabase/supabase-js';
import type { Tables } from '@/backend';

type Props = {
  readonly user: User;
  readonly role: Tables<'user_roles'> | null;
  readonly onLogout: () => void;
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  landlord: 'Wynajmujący',
  tenant: 'Najemca',
};

export const UserMenu = ({ user, role, onLogout }: Props): JSX.Element => {
  const roleLabel: string = role !== null
    ? (ROLE_LABELS[role.role] ?? role.role)
    : '—';

  return (
    <div className="border-t border-gray-200 pt-4">
      <div className="mb-2">
        <p className="text-sm font-medium text-gray-900 truncate">
          {user.email}
        </p>
        <p className="text-xs text-gray-500">{roleLabel}</p>
      </div>
      <button
        type="button"
        onClick={onLogout}
        className="w-full rounded-md bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-300 transition-colors"
      >
        Wyloguj
      </button>
    </div>
  );
};