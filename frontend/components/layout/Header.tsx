// components/layout/Header.tsx
'use client';

import React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export const Header: React.FC = () => {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === `/${locale}${path}` || pathname === `/${locale}${path}/`;
  };

  return (
    <header className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href={`/${locale}`} className="text-2xl font-bold text-primary">
            BenoCode
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href={`/${locale}`}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('') ? 'text-primary bg-primary/10' : 'text-text hover:text-primary'
              }`}
            >
              {t('home')}
            </Link>
            <Link
              href={`/${locale}/#services`}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/#services') ? 'text-primary bg-primary/10' : 'text-text hover:text-primary'
              }`}
            >
              {t('services')}
            </Link>
            <Link
              href={`/${locale}/#contact`}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/#contact') ? 'text-primary bg-primary/10' : 'text-text hover:text-primary'
              }`}
            >
              {t('contact')}
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link href="/admin/login">
              <Button variant="outline" size="sm">
                Admin
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

const LanguageSwitcher: React.FC = () => {
  const locale = useLocale();
  const pathname = usePathname();

  const languages = [
    { code: 'en', label: 'EN' },
    { code: 'sk', label: 'SK' },
    { code: 'cz', label: 'CZ' },
    { code: 'de', label: 'DE' },
  ];

  // Remove locale from pathname and add new locale
  const getNewPath = (newLocale: string) => {
    const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';
    return `/${newLocale}${pathWithoutLocale}`;
  };

  return (
    <div className="flex items-center gap-2">
      {languages.map((lang) => (
        <Link
          key={lang.code}
          href={getNewPath(lang.code)}
          className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
            locale === lang.code
              ? 'bg-primary text-white'
              : 'text-text hover:bg-gray-100'
          }`}
        >
          {lang.label}
        </Link>
      ))}
    </div>
  );
};

