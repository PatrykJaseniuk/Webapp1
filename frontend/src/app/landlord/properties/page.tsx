import { RoleGuard } from '@/components/shared/RoleGuard';
import { PropertiesPage } from '@/components/landlord/PropertiesPage';

export default function Page() {
    return (
        <RoleGuard allowedRoles={['landlord', 'admin']}>
            <PropertiesPage />
        </RoleGuard>
    );
}
