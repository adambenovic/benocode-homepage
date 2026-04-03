// app/[locale]/gdpr/page.tsx
import { LegalPageContent } from '@/components/legal/LegalPageContent';

export const dynamic = 'force-dynamic';

export default function GDPRPage() {
  return <LegalPageContent slug="gdpr" fallbackTitle="GDPR" />;
}
