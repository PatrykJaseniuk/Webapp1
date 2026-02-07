import type { Metadata } from 'next';
import { AuthProvider } from '@/contexts/AuthContext';
<<<<<<< HEAD
import './globals.css';

export const metadata: Metadata = {
    title: 'Rental Management App',
    description: 'Manage your rental properties and tenants',
=======
import { Header } from '@/components/Header';
import '@/styles/globals.css';

export const metadata: Metadata = {
    title: 'Rental Manager',
    description: 'Property rental management system',
>>>>>>> LLM(claude-haiku-4-5)
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
<<<<<<< HEAD
=======


    

>>>>>>> LLM(claude-haiku-4-5)
    return (
        <html lang="en">
            <body>
                <AuthProvider>
<<<<<<< HEAD
                    {children}
=======
                    <Header />
                    <main>{children}</main>
>>>>>>> LLM(claude-haiku-4-5)
                </AuthProvider>
            </body>
        </html>
    );
<<<<<<< HEAD
}
=======
}
>>>>>>> LLM(claude-haiku-4-5)
