import { AppLayout } from "@/components/shared/AppLayout";
import { RoleGuard } from "@/components/shared/RoleGuard";

export default function LandlordLayout({ children }: { children: React.ReactNode }) {
    return (
        <RoleGuard allowedRoles={['Landlord', 'admin']}>
            <AppLayout>
                {children}
            </AppLayout>
        </RoleGuard>
    );
}
