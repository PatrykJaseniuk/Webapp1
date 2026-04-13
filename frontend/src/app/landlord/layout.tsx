import { AppLayout } from '@/components/coreComponents/AppLayout';
import { RoleGuard } from '@/components/coreComponents/RoleGuard';

export default function LandlordLayout({ children }: { children: React.ReactNode }) {

    function Book(name:string){
         
    }

    return (
        <RoleGuard allowedRoles={['landlord', 'admin']}>
            <AppLayout>{children}</AppLayout>
        </RoleGuard>
    );
}
