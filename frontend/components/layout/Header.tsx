// components/layout/Header.tsx
'use client';

import React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DarkModeToggle } from '@/components/ui/DarkModeToggle';

export const Header: React.FC = () => {
  const t = useTranslations('nav');
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '') {
      return pathname === '/' || pathname === '';
    }
    return pathname === path || pathname.startsWith(path);
  };

  return (
    <header className="bg-white dark:bg-gray-900 shadow-md fixed top-0 left-0 right-0 z-50 transition-colors">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-2xl font-bold text-primary dark:text-white">
            BenoCode
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('') ? 'text-primary dark:text-white bg-primary/10 dark:bg-primary/20' : 'text-text dark:text-gray-300 hover:text-primary dark:hover:text-white'
              }`}
            >
              {t('home')}
            </Link>
            <Link
              href="/#services"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/#services') ? 'text-primary dark:text-white bg-primary/10 dark:bg-primary/20' : 'text-text dark:text-gray-300 hover:text-primary dark:hover:text-white'
              }`}
            >
              {t('services')}
            </Link>
            <Link
              href="/#book-meeting"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/#book-meeting') ? 'text-primary dark:text-white bg-primary/10 dark:bg-primary/20' : 'text-text dark:text-gray-300 hover:text-primary dark:hover:text-white'
              }`}
            >
              {t('meet')}
            </Link>
            <Link
              href="/#contact"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/#contact') ? 'text-primary dark:text-white bg-primary/10 dark:bg-primary/20' : 'text-text dark:text-gray-300 hover:text-primary dark:hover:text-white'
              }`}
            >
              {t('contact')}
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <DarkModeToggle />
            <LanguageSwitcher />
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

  const handleLanguageChange = (newLocale: string) => {
    // Set the locale cookie (next-intl middleware reads this)
    // The cookie name used by next-intl middleware
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    // Reload the page to apply the new locale
    window.location.reload();
  };

  return (
    <div className="flex items-center gap-2">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => handleLanguageChange(lang.code)}
          className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
            locale === lang.code
              ? 'bg-primary text-white'
              : 'text-text dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
};

