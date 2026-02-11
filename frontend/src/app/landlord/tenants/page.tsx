import { RoleGuard } from '@/components/shared/RoleGuard';
import { TenantsPage } from '@/components/landlord/TenantsPage';

export default function Page() {
    return (
        <RoleGuard allowedRoles={['landlord', 'admin']}>
            <TenantsPage />
        </RoleGuard>
    );
}
