'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loading } from '@/components/Loading';

export default function HomePage() {
    const { user, role, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        !loading && (
            !user ? router.push('/login') :
                role === 'admin' ? router.push('/admin/dashboard') :
                    role === 'landlord' ? router.push('/landlord/dashboard') :
                        role === 'tenant' && router.push('/tenant/dashboard')
        );
    }, [user, role, loading, router]);

    return <Loading />;
}
