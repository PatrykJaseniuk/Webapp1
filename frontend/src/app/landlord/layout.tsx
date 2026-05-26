import { AppLayout } from '@/components/core/AppLayout';
import { RoleGuard } from '@/components/core/RoleGuard';

export default function LandlordLayout({ children }: { children: React.ReactNode }) {

    function Book(name: string) {

    }

    return (
        <RoleGuard allowedRoles={['landlord', 'admin']}>
            <AppLayout>{children}</AppLayout>
        </RoleGuard>
    );
}
