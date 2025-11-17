import '../styles/globals.css';
import { QueryProvider } from '@/providers/QueryProvider';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  icons: {
    icon: 'https://benocode.sk/favicon.ico',
    shortcut: 'https://benocode.sk/favicon.ico',
    apple: 'https://benocode.sk/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen">
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}

