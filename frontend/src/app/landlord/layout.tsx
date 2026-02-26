import { AppLayout } from '@/components/coreComponents/AppLayout';
import { RoleGuard } from '@/components/coreComponents/RoleGuard';

export default function LandlordLayout({ children }: { children: React.ReactNode }) {
    return (
        <RoleGuard allowedRoles={['landlord', 'admin']}>
            <AppLayout>{children}</AppLayout>
        </RoleGuard>
    );
}
