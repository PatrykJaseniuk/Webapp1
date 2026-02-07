import type { Metadata } from 'next';
import { AuthProvider } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import '@/styles/globals.css';

export const metadata: Metadata = {
    title: 'Rental Manager',
    description: 'Property rental management system',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {


    

    return (
        <html lang="en">
            <body>
                <AuthProvider>
                    <Header />
                    <main>{children}</main>
                </AuthProvider>
            </body>
        </html>
    );
}
