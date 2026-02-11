import { RoleGuard } from '@/components/shared/RoleGuard';
import { PaymentsPage } from '@/components/landlord/PaymentsPage';

export default function Page() {
    return (
        <RoleGuard allowedRoles={['landlord', 'admin']}>
            <PaymentsPage />
        </RoleGuard>
    );
}
