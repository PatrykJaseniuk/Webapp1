import { RoleGuard } from '@/components/shared/RoleGuard';
import { BillingPage } from '@/components/landlord/BillingPage';

export default function Page() {
    return (
        <RoleGuard allowedRoles={['landlord', 'admin']}>
            <BillingPage />
        </RoleGuard>
    );
}
