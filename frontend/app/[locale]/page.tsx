// app/[locale]/page.tsx
'use client';

import { HeroSection } from '@/components/sections/HeroSection';
import { ServicesSection } from '@/components/sections/ServicesSection';
import { TestimonialsSection } from '@/components/sections/TestimonialsSection';
import { MeetingBookingSection } from '@/components/sections/MeetingBookingSection';
import { ContactSection } from '@/components/sections/ContactSection';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <ServicesSection />
      <TestimonialsSection />
      <MeetingBookingSection />
      <ContactSection />
    </div>
  );
}
