<div align="center">
    <img src="public/assets/profile/banner.gif" alt="Althentic.dev banner" width="100%" />
</div>

# Althentic.Dev

Althentic is a multi-tenant marketplace for ready-to-use prompts and digital products. Buyers pay sellers directly using the seller's QR code. The platform records its commission as an amount owed by the seller; it does not hold buyer funds.

## Technology

- Next.js App Router with TypeScript
- Prisma with Neon PostgreSQL (`DATABASE_URL` pooled; `DIRECT_URL` for migrations)
- Bun for package management
- Local file storage in `storage/`

Production deployment targets Vercel and Neon. Receipt files use the private Neon Object Storage bucket `receipts`. Production banners and store QR images use the public Supabase bucket named by `SUPABASE_STORAGE_BUCKET_BANNERS`; product previews use the public bucket named by `SUPABASE_STORAGE_BUCKET_PREVIEWS`. Local development continues to use `storage/`.

## Local development

1. Install Bun and the project dependencies with `bun install --frozen-lockfile`.
2. Copy `.env.example` to `.env` and configure both database URLs for a dedicated, non-production Neon branch. Keep `.env` private and never put production credentials in it.
3. Apply committed schema migrations with `bun run db:deploy`.
4. Start the development server with `bun run dev`.

Prisma uses PostgreSQL. `DATABASE_URL` is the pooled runtime connection and `DIRECT_URL` is used by Prisma migration commands. `bun run db:deploy` applies committed migrations; `bun run db:push` is for controlled development only and does not enable automatic data loss. Do not point local development at production data.
Receipt uploads require a configured Neon Object Storage endpoint, credentials, and private `receipts` bucket; the application does not silently store receipts in Supabase or local storage when that configuration is missing.

## Supabase Storage production setup

Create two Supabase Storage buckets before deploying: the bucket configured by `SUPABASE_STORAGE_BUCKET_BANNERS` for store banners and QR images, and the bucket configured by `SUPABASE_STORAGE_BUCKET_PREVIEWS` for product previews. Set both buckets to **Public** so public asset URLs and the storage readiness probe work without authentication. Uploads and deletes run only on the server with `SUPABASE_SERVICE_ROLE_KEY`; never expose this key in a `NEXT_PUBLIC_` variable or browser code. Production also requires `SUPABASE_URL`. Local development does not use these variables for file writes.

`/api/health` checks PostgreSQL, the private Neon `receipts` bucket, and a public Supabase banner object. It returns HTTP 200 only when all three checks are reachable, and HTTP 503 otherwise.

To copy existing files from `storage/public` after configuring `.env`, first run a dry-run, then add `--apply` to upload. The script checks every existing target object before uploading, refuses to overwrite objects whose SHA-256 differs, verifies uploaded bytes, and leaves all source files in place:

```powershell
bun --env-file=.env scripts/migrate-supabase-public-assets.ts --source .\storage\public
bun --env-file=.env scripts/migrate-supabase-public-assets.ts --source .\storage\public --apply
```

Run the migration from the repository root. It maps `banners/` and `qr/` to the banners bucket, and `products/` to the previews bucket. The migration reports counts and byte totals only, not environment values or file contents. Do not remove the local source until you have confirmed the public files load in production.

The one-time `bun run scripts/migrate-sqlite-to-neon.ts` utility imports relational rows from `db/custom.db` and linked private receipt WebP files. It refuses to run when destination application tables are non-empty, verifies row counts and receipt bytes, and never deletes the source database or files. Run it only after `bun run db:deploy` and after confirming the Neon target branch is the intended production database.

## Project documents

- `docs/PRD.md`: product requirements
- `docs/SPEC.md`: detailed decisions and unresolved questions
- `docs/ARCHITECTURE.md`: system boundaries and data flows
- `docs/DESIGN.md`: interface and design constraints
- `docs/CONTEXT.md`: project handoff context
- `docs/WORKFLOW.md`: end-to-end user and operational flows

## GitHub Actions dan backup

Repository ini belum memiliki workflow backup GitHub Actions. Jika workflow `pg_dump` ditambahkan, kredensial database dan storage disimpan sebagai GitHub Actions Secrets pada repository atau organization, bukan di `.env` aplikasi. Nama bucket dan region yang tidak rahasia dapat menjadi Actions Variables atau konfigurasi workflow. Nama konfigurasi ditentukan bersama workflow yang benar-benar menggunakannya. Backup tersebut belum diimplementasikan oleh kode aplikasi.

## License

All rights reserved. See `LICENSE`.
