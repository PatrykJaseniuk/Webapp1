'use client';
import { useRouter } from 'next/navigation';

export const useNavigate = () => {
    const router = useRouter();
    return (path: string) => router.push(path);
};
