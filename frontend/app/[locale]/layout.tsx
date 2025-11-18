// app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
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

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });

  return {
    title: t('title'),
    description: t('subtitle'),
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

  const messages = await getMessages({ locale });

  return (
    <>
      <GoogleAnalytics />
      <NextIntlClientProvider messages={messages}>
        <div className="bg-white dark:bg-gray-900 min-h-screen transition-colors">
          <Header />
          <main className="flex-1 pt-16">{children}</main>
          <Footer />
          <ToastContainer />
          <CookieConsent />
        </div>
      </NextIntlClientProvider>
    </>
  );
}
