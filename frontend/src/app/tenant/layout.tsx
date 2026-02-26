import { AppLayout } from '@/components/coreComponents/AppLayout';
import { RoleGuard } from '@/components/coreComponents/RoleGuard';

export default function TenantLayout({ children }: { children: React.ReactNode }) {
    return (
        <RoleGuard allowedRoles={['tenant']}>
            <AppLayout>{children}</AppLayout>
        </RoleGuard>
    );
}
