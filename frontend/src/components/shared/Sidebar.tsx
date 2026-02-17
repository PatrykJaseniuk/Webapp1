'use client';

import Link from 'next/link';

import { routes } from '@/routes';
import { useUserRole } from '@/hooks/useUserRole';

import styles from './Sidebar.module.css';

const TENANT_NAV = [
    { href: routes.tenant.dashboard(), label: 'Panel główny' },
    { href: routes.tenant.properties(), label: 'Nieruchomości' },
    { href: routes.tenant.leases(), label: 'Umowy najmu' },
    { href: routes.tenant.billing(), label: 'Rozliczenia' },
    { href: routes.tenant.profile(), label: 'Profil' },
];

const LANDLORD_NAV = [
    { href: routes.landlord.dashboard(), label: 'Panel główny' },
    { href: routes.landlord.properties(), label: 'Nieruchomości' },
    { href: routes.landlord.tenants(), label: 'Najemcy' },
    { href: routes.landlord.leases(), label: 'Umowy najmu' },
    { href: routes.landlord.payments(), label: 'Transakcje' },
];

const ADMIN_NAV = [
    { href: routes.admin.users(), label: 'Użytkownicy' },
];

export const Sidebar = () => {
    const { role } = useUserRole();

    const navItems =
        role === 'admin' ? [...ADMIN_NAV, ...LANDLORD_NAV] :
            role === 'landlord' ? LANDLORD_NAV :
                role === 'tenant' ? TENANT_NAV :
                    [];

    return (
        <aside className={styles.sidebar}>
            <nav className={styles.nav}>
                <ul className={styles.navList}>
                    {navItems.map(({ href, label }, index) => (
                        <li key={index} className={styles.navItem}>
                            <Link className={styles.navLink} href={href}>{label}</Link>
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    );
};
