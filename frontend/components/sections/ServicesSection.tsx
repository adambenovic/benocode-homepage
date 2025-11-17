// components/sections/ServicesSection.tsx
'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export const ServicesSection: React.FC = () => {
  const t = useTranslations('home.services');

  const services = [
    {
      title: t('items.customSoftware.title'),
      description: t('items.customSoftware.description'),
      icon: '💻',
    },
    {
      title: t('items.webApplications.title'),
      description: t('items.webApplications.description'),
      icon: '🌐',
    },
    {
      title: t('items.apiDevelopment.title'),
      description: t('items.apiDevelopment.description'),
      icon: '🔌',
    },
    {
      title: t('items.consulting.title'),
      description: t('items.consulting.description'),
      icon: '💡',
    },
  ];

  return (
    <section id="services" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-text mb-4">{t('title')}</h2>
          <p className="text-lg text-text-light">{t('description')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <Card key={index} className="text-center">
              <CardHeader>
                <div className="text-4xl mb-4">{service.icon}</div>
                <CardTitle>{service.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-text-light">{service.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

