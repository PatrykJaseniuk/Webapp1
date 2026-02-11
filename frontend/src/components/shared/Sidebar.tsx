'use client';

import Link from 'next/link';

import { useUserRole } from '@/hooks/useUserRole';

import styles from './Sidebar.module.css';

const TENANT_NAV = [
    { href: '/tenant/dashboard', label: 'Panel główny' },
    { href: '/tenant/properties', label: 'Nieruchomości' },
    { href: '/tenant/leases', label: 'Umowy najmu' },
    { href: '/tenant/billing', label: 'Rozliczenia' },
    { href: '/tenant/meters', label: 'Liczniki' },
    { href: '/tenant/profile', label: 'Profil' },
];

const LANDLORD_NAV = [
    { href: '/landlord/dashboard', label: 'Panel główny' },
    { href: '/landlord/properties', label: 'Nieruchomości' },
    { href: '/landlord/tenants', label: 'Najemcy' },
    { href: '/landlord/leases', label: 'Umowy najmu' },
    { href: '/landlord/billing', label: 'Rozliczenia' },
    { href: '/landlord/payments', label: 'Płatności' },
    { href: '/landlord/meters', label: 'Liczniki' },
    { href: '/landlord/utility-prices', label: 'Ceny mediów' },
    { href: '/landlord/expenses', label: 'Wydatki' },
];

const ADMIN_NAV = [
    { href: '/admin/users', label: 'Użytkownicy' },
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
