import { AppLayout } from '@/components/shared/AppLayout';
import { RoleGuard } from '@/components/shared/RoleGuard';

export default function TenantLayout({ children }: { children: React.ReactNode }) {
    return (
        <RoleGuard allowedRoles={['tenant']}>
            <AppLayout>{children}</AppLayout>
        </RoleGuard>
    );
}
