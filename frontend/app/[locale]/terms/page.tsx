// app/[locale]/terms/page.tsx
import { LegalPageContent } from '@/components/legal/LegalPageContent';

export const dynamic = 'force-dynamic';

export default function TermsPage() {
  return <LegalPageContent slug="terms" fallbackTitle="Terms of Service" />;
}
