import { AppLayout } from '@/components/core/AppLayout';
import { RoleGuard } from '@/components/core/RoleGuard';

export default function TenantLayout({ children }: { children: React.ReactNode }) {
    return (
        <RoleGuard allowedRoles={['tenant']}>
            <AppLayout>{children}</AppLayout>
        </RoleGuard>
    );
}
