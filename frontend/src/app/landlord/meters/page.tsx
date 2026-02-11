import { RoleGuard } from '@/components/shared/RoleGuard';
import { MetersPage } from '@/components/landlord/MetersPage';

export default function Page() {
    return (
        <RoleGuard allowedRoles={['landlord', 'admin']}>
            <MetersPage />
        </RoleGuard>
    );
}
