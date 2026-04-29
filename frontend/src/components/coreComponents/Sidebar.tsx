'use client';
import Link from 'next/link';

import { useAuth } from '@/api/useAuth';
import { routes } from '@/routes';
import styles from '@/components/styles/shared.module.css';

const LANDLORD_LINKS = [
    { label: 'Panel', href: routes.landlord.dashboard() },
    { label: 'Nieruchomości', href: routes.landlord.properties() },
    { label: 'Najemcy', href: routes.landlord.tenants() },
    { label: 'Umowy', href: routes.landlord.leases() },
    { label: 'Transakcje', href: routes.landlord.transactions() },
] as const;

const TENANT_LINKS = [
    { label: 'Panel', href: routes.tenant.dashboard() },
] as const;

const ROLE_LINKS: Record<string, readonly { label: string; href: string }[]> = {
    landlord: LANDLORD_LINKS,
    admin: LANDLORD_LINKS,
    tenant: TENANT_LINKS,
};

export const Sidebar = () => {
    const { role } = useAuth();
    const links = ROLE_LINKS[role ?? ''] ?? [];

    return (
        <nav className={styles.sidebar}>
            <div className={styles.sidebarBrand}>Rent Manager</div>
            <ul className={styles.sidebarNav}>
                {links.map((link) => (
                    <li key={link.href}>
                        <Link href={link.href} className={styles.sidebarLink}>
                            {link.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
    );
};
