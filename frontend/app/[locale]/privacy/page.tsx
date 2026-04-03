// app/[locale]/privacy/page.tsx
import { LegalPageContent } from '@/components/legal/LegalPageContent';

export const dynamic = 'force-dynamic';

export default function PrivacyPage() {
  return <LegalPageContent slug="privacy" fallbackTitle="Privacy Policy" />;
}
