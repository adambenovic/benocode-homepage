// components/sections/HeroSection.tsx
'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';

export const HeroSection: React.FC = () => {
  const t = useTranslations('home.hero');

  return (
    <section className="bg-gradient-to-r from-primary to-primary-light text-white py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">{t('title')}</h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-100">{t('description')}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#book-meeting">
              <Button variant="secondary" size="lg">
                {t('getStarted')}
              </Button>
            </a>
            <a href="#services">
              <Button variant="outline" size="lg" className="bg-transparent border-white text-white hover:bg-white/10">
                {t('learnMore')}
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

