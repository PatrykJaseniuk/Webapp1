'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loading } from '@/components/Loading';

export default function HomePage() {
    const { user, role, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        const redirect = () => {
            loading ? null :
                !user ? router.push('/login') :
                    role === 'admin' ? router.push('/admin/dashboard') :
                        role === 'tenant' ? router.push('/tenant/dashboard') :
                            role === 'landlord' ? router.push('/landlord/dashboard') :
                                null;
        };

        redirect();
    }, [user, role, loading, router]);

    return <Loading message="Redirecting..." />;
}
