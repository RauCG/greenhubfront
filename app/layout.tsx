// app/layout.tsx

import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import { AuthProvider } from '@/context/AuthContext';
import WidgetManagerWrapper from '@/components/widget-wraper-component';




const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GreenHub',
  description: 'GreenHub: Tu tienda de plantas y flores.',
  icons: {
    icon: '/log.webp',
    apple: '/log.webp',
  },
  generator: 'greenhub.dev',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <WidgetManagerWrapper />
        </AuthProvider>
      </body>
    </html>
  );
}
