<div align="center">
    <img src="public/assets/profile/banner.gif" alt="Althentic.dev banner" width="100%" />
</div>

# Althentic.Dev

Althentic is a multi-tenant marketplace for ready-to-use prompts and digital products. Buyers pay sellers directly using the seller's QR code. The platform records its commission as an amount owed by the seller; it does not hold buyer funds.

## Technology

- Next.js App Router with TypeScript
- Prisma with SQLite for local development
- Bun for package management
- Local file storage in `storage/`

Production deployment targets Vercel, Neon Postgres, and Supabase Storage. Review `AGENTS.md` and the documents in `docs/` before changing product behavior or deployment configuration.

## Local development

1. Install Bun and the project dependencies with `bun install`.
2. Copy `.env.example` to `.env` and replace the local development placeholders. Keep `.env` private and never put production credentials in it.
3. Start the development server with `bun run dev`.

The environment template uses a local SQLite database and local file storage. Do not point local development at production data.

## Project documents

- `docs/PRD.md`: product requirements
- `docs/SPEC.md`: detailed decisions and unresolved questions
- `docs/ARCHITECTURE.md`: system boundaries and data flows
- `docs/DESIGN.md`: interface and design constraints
- `docs/CONTEXT.md`: project handoff context
- `docs/WORKFLOW.md`: end-to-end user and operational flows

## License

All rights reserved. See `LICENSE`.
