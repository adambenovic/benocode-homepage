# Legal Documents Import Script

This script automatically imports legal documents (GDPR, Privacy Policy, Terms of Service) from the markdown file into the database.

## Files

- `import-legal-docs.ts` - Main import script that parses legal-documents.md
- `../docs/legal-documents.md` - Source file containing all legal documents in all languages

## Usage

### Automatic Import (First Run)

When you run the seed script for the first time with an empty database, legal documents will be imported automatically:

```bash
npm run prisma:seed
```

### Manual Import

To manually import legal documents at any time:

```bash
npm run import:legal
```

### Force Re-import

If you need to update existing legal documents:

1. Delete existing legal pages from the database (via Prisma Studio or SQL)
2. Run the import script again:

```bash
npm run import:legal
```

Or use the seed script with the SEED_LEGAL environment variable:

```bash
SEED_LEGAL=true npm run prisma:seed
```

## What Gets Imported

The script imports three legal documents, each with translations in 4 languages:

### 1. GDPR Compliance Document
- **Slug:** `gdpr`
- **Languages:** EN, SK, DE, CZ
- **URL:** `/gdpr`

### 2. Privacy Policy
- **Slug:** `privacy`
- **Languages:** EN, SK, DE, CZ  
- **URL:** `/privacy`

### 3. Terms of Service
- **Slug:** `terms`
- **Languages:** EN, SK, DE, CZ
- **URL:** `/terms`

## How It Works

1. **Parse Markdown:** Reads `docs/legal-documents.md` and extracts sections
2. **Extract Content:** Finds each language version using section markers
3. **Database Insert:** Creates `LegalPage` records with translations
4. **Skip Duplicates:** Won't overwrite existing pages with the same slug

## Document Format in Markdown

The script expects this structure in `legal-documents.md`:

```markdown
## 1. GDPR COMPLIANCE DOCUMENT

### ENGLISH (EN)

**Title:** GDPR Information

**Content:**

[Full markdown content here...]

---

### SLOVAK (SK)

**Title:** Informácie o GDPR

**Content:**

[Full markdown content here...]

---
```

## Troubleshooting

### Script Can't Find legal-documents.md

Ensure the file exists at: `backend/docs/legal-documents.md`

### Import Fails

Check that:
1. Database is running
2. Prisma migrations are up to date (`npm run prisma:migrate`)
3. Markdown file is properly formatted
4. No existing pages conflict (delete them first)

### Partial Import

If only some documents import, check the markdown file for:
- Correct section markers
- Proper `**Title:**` and `**Content:**` formatting
- Section separators (`---`)

## Production Deployment

### Docker

The seed script will run automatically during container startup if no legal pages exist.

### Manual Deployment

After deploying to production:

```bash
# SSH into production server
cd /path/to/backend

# Run import
npm run import:legal

# Or run full seed
npm run prisma:seed
```

### Environment Variables

You can control the import behavior:

```bash
# Force import even if pages exist
SEED_LEGAL=true npm run prisma:seed

# Custom admin credentials (for seed script)
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=SecurePass123! npm run prisma:seed
```

## Legal Document Updates

When updating legal documents:

1. **Edit** `docs/legal-documents.md`
2. **Update** the "Last Updated" date in each document
3. **Delete** existing legal pages (via admin panel or database)
4. **Re-import** using `npm run import:legal`
5. **Verify** by visiting `/gdpr`, `/privacy`, `/terms` on the website

## Notes

- ⚠️ **Legal Review Required:** All documents should be reviewed by a qualified attorney before use
- 📝 **Version Control:** Keep old versions of legal documents for compliance
- 🔄 **Regular Updates:** Review and update legal documents at least annually
- 📧 **User Notification:** Notify users of significant changes via email

## Support

For issues with the import script:
1. Check the console output for error messages
2. Verify the markdown file format
3. Check database connectivity
4. Review Prisma schema for any changes to LegalPage model

