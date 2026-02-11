import { RoleGuard } from '@/components/shared/RoleGuard';
import { LeasesPage } from '@/components/landlord/LeasesPage';

export default function Page() {
    return (
        <RoleGuard allowedRoles={['landlord', 'admin']}>
            <LeasesPage />
        </RoleGuard>
    );
}
