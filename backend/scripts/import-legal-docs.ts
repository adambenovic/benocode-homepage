// scripts/import-legal-docs.ts
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as fs from 'fs';
import * as path from 'path';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

interface LegalDocument {
  slug: string;
  translations: {
    locale: 'EN' | 'SK' | 'DE' | 'CZ';
    title: string;
    content: string;
  }[];
}

// Parse the markdown file and extract legal documents
function parseLegalDocuments(markdownPath: string): LegalDocument[] {
  const content = fs.readFileSync(markdownPath, 'utf-8');
  const documents: LegalDocument[] = [];

  // Document slugs and their section markers
  const docDefinitions = [
    { slug: 'gdpr', sectionMarker: '## 1. GDPR COMPLIANCE DOCUMENT' },
    { slug: 'privacy', sectionMarker: '## 2. PRIVACY POLICY' },
    { slug: 'terms', sectionMarker: '## 3. TERMS OF SERVICE' },
  ];

  for (const docDef of docDefinitions) {
    const translations: {
      locale: 'EN' | 'SK' | 'DE' | 'CZ';
      title: string;
      content: string;
    }[] = [];

    // Find the document section
    const sectionStart = content.indexOf(docDef.sectionMarker);
    if (sectionStart === -1) {
      console.warn(`⚠️  Section "${docDef.sectionMarker}" not found`);
      continue;
    }

    // Find the next document section or end
    let sectionEnd = content.length;
    const nextSectionIndex = docDefinitions.findIndex((d) => d.slug === docDef.slug);
    if (nextSectionIndex < docDefinitions.length - 1) {
      const nextSection = content.indexOf(
        docDefinitions[nextSectionIndex + 1].sectionMarker,
        sectionStart + 1
      );
      if (nextSection !== -1) {
        sectionEnd = nextSection;
      }
    } else {
      // For the last document, find the implementation instructions
      const implSection = content.indexOf('## 4. IMPLEMENTATION INSTRUCTIONS', sectionStart);
      if (implSection !== -1) {
        sectionEnd = implSection;
      }
    }

    const sectionContent = content.substring(sectionStart, sectionEnd);

    // Extract translations for each language
    const languages = [
      { code: 'EN', marker: '### ENGLISH (EN)' },
      { code: 'SK', marker: '### SLOVAK (SK)' },
      { code: 'DE', marker: '### GERMAN (DE)' },
      { code: 'CZ', marker: '### CZECH (CZ)' },
    ];

    for (const lang of languages) {
      const langStart = sectionContent.indexOf(lang.marker);
      if (langStart === -1) continue;

      // Find the next language section or end of document section
      const nextLangIndex = languages.findIndex((l) => l.code === lang.code);
      let langEnd = sectionContent.length;
      if (nextLangIndex < languages.length - 1) {
        const nextLangStart = sectionContent.indexOf(
          languages[nextLangIndex + 1].marker,
          langStart + 1
        );
        if (nextLangStart !== -1) {
          langEnd = nextLangStart;
        }
      }

      const langContent = sectionContent.substring(langStart, langEnd);

      // Extract title
      const titleMatch = langContent.match(/\*\*Title:\*\*\s*(.+)/);
      const title = titleMatch ? titleMatch[1].trim() : `${docDef.slug.toUpperCase()} (${lang.code})`;

      // Extract content (everything after **Content:**)
      // Since we've already isolated langContent by finding the next language marker,
      // we can safely extract everything after **Content:**
      const contentStart = langContent.indexOf('**Content:**');
      if (contentStart !== -1) {
        let content = langContent.substring(contentStart + '**Content:**'.length).trim();
        
        // Remove the trailing --- separator if present
        content = content.replace(/\n---\s*$/, '').trim();
        
        translations.push({
          locale: lang.code as 'EN' | 'SK' | 'DE' | 'CZ',
          title,
          content,
        });
      }
    }

    if (translations.length > 0) {
      documents.push({
        slug: docDef.slug,
        translations,
      });
    }
  }

  return documents;
}

async function importLegalDocuments() {
  console.log('🔒 Importing legal documents from markdown...\n');

  // Try multiple possible paths
  const possiblePaths = [
    path.join(process.cwd(), 'docs/legal-documents.md'), // /app/docs/ (Docker volume)
    path.join(process.cwd(), '../docs/legal-documents.md'), // From backend dir (local dev)
    path.join(__dirname, '../../docs/legal-documents.md'), // Relative to scripts dir
    path.join(__dirname, '../docs/legal-documents.md'), // Compiled dist path
  ];

  let markdownPath = '';
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      markdownPath = p;
      break;
    }
  }

  if (!markdownPath) {
    console.error(`❌ File not found. Tried the following paths:`);
    possiblePaths.forEach(p => console.error(`   - ${p}`));
    console.error('\n   Please ensure the legal-documents.md file exists in the docs directory.');
    process.exit(1);
  }

  console.log(`📁 Using legal documents from: ${markdownPath}\n`);

  try {
    const documents = parseLegalDocuments(markdownPath);

    console.log(`📄 Found ${documents.length} legal documents\n`);

    for (const doc of documents) {
      const existing = await prisma.legalPage.findUnique({
        where: { slug: doc.slug },
      });

      if (existing) {
        console.log(`   ℹ️  Legal page "${doc.slug}" already exists, skipping...`);
        continue;
      }

      await prisma.legalPage.create({
        data: {
          slug: doc.slug,
          translations: {
            create: doc.translations.map((t) => ({
              locale: t.locale,
              title: t.title,
              content: t.content,
            })),
          },
        },
      });

      console.log(`   ✅ Created legal page: ${doc.slug}`);
      console.log(`      - ${doc.translations.length} translations imported`);
      doc.translations.forEach((t) => {
        console.log(`        • ${t.locale}: ${t.title}`);
      });
      console.log('');
    }

    console.log('✅ Legal documents imported successfully!\n');
  } catch (error) {
    console.error('❌ Error importing legal documents:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  importLegalDocuments()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default importLegalDocuments;

