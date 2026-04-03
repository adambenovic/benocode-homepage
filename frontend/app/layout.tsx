import '../styles/globals.css';
import { QueryProvider } from '@/providers/QueryProvider';
import { getLocale } from 'next-intl/server';
import type { Metadata } from 'next';

// All pages are dynamic (backend API dependent) — skip static prerendering
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();

  return (
    <html lang={locale} className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedMode = localStorage.getItem('darkMode');
                  const isDark = savedMode === null ? true : savedMode === 'true';
                  if (!isDark) {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="flex flex-col min-h-screen" suppressHydrationWarning>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}

