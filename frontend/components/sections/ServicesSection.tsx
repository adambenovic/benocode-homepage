// components/sections/ServicesSection.tsx
'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useScrollReveal } from '@/hooks/useScrollReveal';

function IconCode({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function IconGlobe({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function IconApi({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16M4 12h16M4 18h16" />
      <circle cx="8" cy="6" r="1" fill="currentColor" />
      <circle cx="8" cy="12" r="1" fill="currentColor" />
      <circle cx="8" cy="18" r="1" fill="currentColor" />
    </svg>
  );
}

function IconBrain({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
      <path d="M10 21h4" />
      <path d="M9 13h6" />
    </svg>
  );
}

function IconLightbulb({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2v1" />
      <path d="M4.22 7.22l.71.71" />
      <path d="M19.07 7.93l.71-.71" />
      <path d="M2 13h1" />
      <path d="M21 13h1" />
      <path d="M15.5 14.5L12 18l-3.5-3.5a5 5 0 1 1 7 0z" />
    </svg>
  );
}

function IconCube({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

const SERVICE_ICONS = [IconCode, IconGlobe, IconApi, IconBrain, IconLightbulb, IconCube];

export const ServicesSection: React.FC = () => {
  const t = useTranslations('home.services');
  const headerRef = useScrollReveal();
  const gridRef = useScrollReveal<HTMLDivElement>(0.1);

  const services = [
    { title: t('items.customSoftware.title'), description: t('items.customSoftware.description') },
    { title: t('items.webApplications.title'), description: t('items.webApplications.description') },
    { title: t('items.apiDevelopment.title'), description: t('items.apiDevelopment.description') },
    { title: t('items.aiSolutions.title'), description: t('items.aiSolutions.description') },
    { title: t('items.consulting.title'), description: t('items.consulting.description') },
    { title: t('items.printing3d.title'), description: t('items.printing3d.description') },
  ];

  return (
    <section id="services" className="py-20 bg-gray-50 dark:bg-gray-800 transition-colors">
      <div className="container mx-auto px-4">
        <div ref={headerRef} className="scroll-reveal text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-text dark:text-white mb-4">{t('title')}</h2>
          <p className="text-lg text-text-light dark:text-gray-300">{t('description')}</p>
        </div>
        <div ref={gridRef} className="scroll-reveal-stagger grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => {
            const Icon = SERVICE_ICONS[index];
            return (
              <Card key={index} className="text-center group hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <CardHeader>
                  <div className="mx-auto mb-4 w-14 h-14 rounded-xl bg-accent/10 dark:bg-accent/20 flex items-center justify-center group-hover:bg-accent/20 dark:group-hover:bg-accent/30 transition-colors">
                    <Icon className="w-7 h-7 text-accent" />
                  </div>
                  <CardTitle>{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-text-light dark:text-gray-300">{service.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
