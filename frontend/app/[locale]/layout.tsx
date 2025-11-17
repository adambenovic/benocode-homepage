// app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n';
import { QueryProvider } from '@/providers/QueryProvider';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ToastContainer } from '@/components/ui/Toast';
import { CookieConsent } from '@/components/ui/CookieConsent';
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return {
    title: 'BenoCode - Software Solutions',
    description: 'Reliable, Affordable, Individual Approach',
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <>
      <GoogleAnalytics />
      <NextIntlClientProvider messages={messages}>
        <Header />
        <main className="flex-1 pt-16">{children}</main>
        <Footer />
        <ToastContainer />
        <CookieConsent />
      </NextIntlClientProvider>
    </>
  );
}
