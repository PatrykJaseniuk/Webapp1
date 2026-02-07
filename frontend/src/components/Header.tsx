'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import styles from './Header.module.css';

export const Header = () => {
    const { user, role, signOut } = useAuth();

    const adminLinks = [
        { href: '/admin/dashboard', label: 'Dashboard' },
        { href: '/admin/users', label: 'Users' },
        { href: '/admin/settings', label: 'Settings' },
    ];

    const landlordLinks = [
        { href: '/landlord/dashboard', label: 'Dashboard' },
        { href: '/landlord/properties', label: 'Properties' },
        { href: '/landlord/tenants', label: 'Tenants' },
        { href: '/landlord/leases', label: 'Leases' },
        { href: '/landlord/billing', label: 'Billing' },
        { href: '/landlord/utilities', label: 'Utilities' },
    ];

    const tenantLinks = [
        { href: '/tenant/dashboard', label: 'Dashboard' },
        { href: '/tenant/payments', label: 'Payments' },
        { href: '/tenant/documents', label: 'Documents' },
        { href: '/tenant/profile', label: 'Profile' },
    ];

    const links = role === 'admin' ? adminLinks :
        role === 'landlord' ? landlordLinks :
            role === 'tenant' ? tenantLinks :
                [];

    return (
        <header className={styles.header}>
            <div className={styles.container}>
                <Link href="/" className={styles.logo}>
                    Rental Manager
                </Link>

                {user && (
                    <>
                        <nav className={styles.nav}>
                            {links.map((link) => (
                                <Link key={link.href} href={link.href} className={styles.navLink}>
                                    {link.label}
                                </Link>
                            ))}
                        </nav>

                        <div className={styles.userSection}>
                            <span className={styles.userEmail}>{user.email}</span>
                            <span className={styles.roleBadge}>{role}</span>
                            <button onClick={() => signOut()} className={styles.signOutBtn}>
                                Sign Out
                            </button>
                        </div>
                    </>
                )}
            </div>
        </header>
    );
};
