# CLAUDE.md - Althentic

## Project Scope

Althentic is a multi-tenant marketplace for ready-to-use prompts (website, research, learning, and anything else AI can generate from a good prompt). Every seller opens a store with a unique slug and sells products delivered as `.zip` files hosted on Google Drive. Althentic never holds buyer funds: sellers display their own business QR code, buyers pay the seller directly, and Althentic records a flat Rp1.000 commission per verified transaction as "Commission Owed".

## Current Payment and Receipt Architecture

- Buyer transfer receipt uploads are recorded in the database through Prisma and their files are stored through the storage adapter in `src/lib/server/storage.ts`.
- Receipt files are private. They are never placed in `storage/public` and are only served through authorized API routes with per-request authorization.
- Receipt images that were scanned and verified successfully are converted to `.webp` before they are stored.
- Receipt verification is performed by the AI Receipt Scanner in `src/lib/server/scanner/index.ts`, using the seller's own BYOK vision model API keys (primary key plus fallback key). API keys are handled through `src/lib/server/crypto.ts` and must never be logged or exposed to the client.
- Scanner outcomes:
  - Receipt matches the order: the order is auto-verified and the buyer gets download access.
  - Underpayment: verification is rejected automatically and the buyer is asked to upload supplementary proof for the difference.
  - Primary key rate-limited: fall back to the second key.
  - Both keys fail: verification is disabled, a "Hubungi Seller via WhatsApp" button with a ready-to-send message template is shown, and the product is marked "Booked" until follow-up.
  - Seller skipped API key setup: every order goes through manual approval from the seller dashboard, with a persuasive (non-blocking) reminder banner.
- Commission Owed is a running debt to Althentic, not an automatic deduction. Invoices appear when Commission Owed reaches the threshold, then the cycle resets to zero. Commission payment proofs are verified manually by the Super-Admin, without AI.
- Product verification uses the Node.js inspection script in `src/lib/server/inspection.ts` (Google Drive link, live demo HTTP status, screenshot) to produce a Markdown report. The Super-Admin approves or rejects manually, or an AI client approves or rejects on the Super-Admin's behalf through the MCP server (`src/lib/server/mcp.ts`, `src/app/api/mcp/route.ts`) using Streamable HTTP and the same report.
- Local development writes to the `storage/` directory. NeonDB Postgres (database) and Supabase Storage (files) are the supported production targets.
- Do not make Althentic hold, escrow, split, or automatically deduct buyer or seller funds, and do not add a payment gateway, unless the product owner explicitly requests a new architecture decision.

## Technology Decisions

- Althentic is a full-stack Next.js App Router application deployed on Vercel only. All backend logic runs as Next.js API Routes in TypeScript/Node.js.
- Do not introduce a separate backend (for example Django or Python services), persistent socket servers, or long-running background processes. The MCP server must remain a Streamable HTTP API Route compatible with Vercel serverless limits.
- Email notifications use Nodemailer from an API Route.

## Language Style

- Respond only in Indonesian (Bahasa Indonesia) for all outputs.
- Use "Saya" to refer to yourself (not "Aku" or "Gue").
- Use "Anda" to refer to the user (not "Kamu").
- Tone should be formal but leaning casual, not stiff.

## WhatsApp Policy

- WhatsApp notifications and the seller-contact fallback use manually opened `wa.me` links.
- Do not add WAHA, WhatsApp sessions, webhooks, background WhatsApp services, or 24/7 WhatsApp infrastructure.

## Architecture Rules

- Preserve the multi-tenant boundary: every store-scoped query and mutation must be scoped by the resolved store (the store slug resolved to its store identity).
- Keep Seller (store admin) and Super-Admin authorization separate.
- Keep receipt metadata in the database and receipt files behind the storage adapter boundary.
- Preserve the distinction between the cyclical Commission Owed balance and permanent order and transaction history.
- A commission cycle reset must not delete historical order, transaction, or commission records.
- Order verification (approval) and the corresponding Commission Owed update must remain atomic through a database transaction.
- Do not change or delete existing store, product, order, receipt, commission invoice, or storage data without explicit user approval.

## UI/Component Change Rules

- Before changing any UI component (sidebar, header, modal, navigation, or any shared visual element), search the entire codebase for every location where that component is used or rendered. Do not stop after finding the first match.
- Because Althentic renders many views (landing, catalog, product, checkout, store profile, seller dashboard, Super-Admin dashboard) through `src/components/app/althentic-app.tsx` and `src/lib/router.ts`, explicitly check whether the component is a single shared component or duplicated across multiple views/dashboards (e.g. buyer views vs seller dashboard vs Super-Admin dashboard). Never assume one or the other without checking.
- If the same component is found duplicated instead of shared, report this to the user as a potential technical debt issue before making any edit. Do not silently refactor it into a shared component and do not silently leave the duplication as-is.
- After the change is implemented, list every file affected by the change in the final report, in addition to what Delivery Rules already requires.

## Design System Constraints

- Font is Plus Jakarta Sans. Icons come from Lucide. Never use emoji anywhere in the UI.
- Keep Lenis smooth scroll, Framer Motion entrance/exit animations, Dark/Light/System theme support, WCAG accessibility, and responsive behavior for desktop, tablet, and mobile.
- The desktop navbar auto-hides when scrolling down and reappears when scrolling up. The mobile navbar does not auto-hide.

## Ambiguity & Clarification Rules

- If an instruction references an icon, visual asset, or UI element without naming a specific source (an icon library such as Lucide or Heroicons, a specific file, or a visual reference), ask for clarification before making any change. Never assume a default representation (e.g. a plain text character instead of an icon glyph).
- If an instruction can reasonably be interpreted in more than one way, regarding scope (which pages/routes are affected), location (which file/component), or implementation approach, ask a clarifying question before executing.
- Do not propose "better" alternatives, design suggestions, or additional improvements beyond what was explicitly requested, unless the user explicitly asks for recommendations.
- When uncertain whether to ask or to proceed, default to asking.

## Documentation Rules

- `docs/` is the current documentation source.
- The receipt flow must describe the AI Receipt Scanner (BYOK) with manual seller approval as the fallback.
- Do not restore obsolete terminology from the old Althentic concept (a documentation-only product with a 4-stage AI handoff workflow) or describe Althentic as a platform that holds buyer funds, in `docs/`, source comments, environment examples, or prompts.
- Update relevant documentation when route behavior, authorization, data lifecycle, or deployment requirements change.

## Development Rules

- Use the existing project conventions and preserve unrelated working-tree changes.
- Inspect `git status` before editing and never overwrite user changes.
- Use `apply_patch` for focused edits.
- When implementing frontend UI, pages, layouts, or visual interactions, always read and use `.agents/skills/frontend-design/SKILL.md` (or `.claude/skills/frontend-design/SKILL.md` when running in Claude Code) before editing.
- When creating or managing GitHub Issues, Pull Requests, branches, or project workflow, always read and use `.agents/skills/github-project-management/SKILL.md` (or `.claude/skills/github-project-management/SKILL.md` when running in Claude Code) before acting.
- Required skills must be read completely before execution, and their applicable instructions must be followed throughout the task.
- Preserve valid UTF-8 encoding in every file. Do not produce broken encoding, replacement characters, or mojibake.
- Never use the em-dash character (Unicode `U+2014`) in any file, including source code, UI copy, documentation, and comments.
- Before committing, scan all changed files for broken encoding and em-dash characters.
- Do not commit `.env`, secrets, generated logs, build output, or local tool artifacts.
- Before committing, run the narrowest relevant validation, normally:

```bash
npm run lint
npm run build
```

- For schema changes, verify the appropriate Prisma migration strategy before running any database command.
- Never run `prisma db reset` or destructive cleanup commands without explicit approval.

### Toolchain and Side-Effect Rules

These rules exist because a past session ran `prisma generate` to obtain an accurate TypeScript baseline. That command silently installed packages, bumped `@prisma/client` in `package.json`, and created a `package-lock.json` that conflicted with `bun.lock`. The mistake was caught and reverted, but the underlying habit is the problem, not the one command.

- The only lockfile in this repository is `bun.lock`. Never run `npm install`, never run `npx <package>`, and never create a `package-lock.json`. Use `bun install` and `bun run <script>`.
- Before running any command that can install, generate, or update dependencies, state which tracked files it may modify. Commands that do this include `prisma generate`, installers, and any script that copies or rewrites assets.
- After running such a command, always run `git status` and `git diff` to confirm no tracked file changed unexpectedly.
- If such a command changes a tracked file outside the scope of the current task, restore that file with `git checkout -- <file>` and delete any untracked artifact it created. Never carry the side effect into the current task.
- When a side effect is reverted, report it plainly, including which files were touched and how they were restored.

### Changelog and Parallel Branch Rules

These rules exist because seven Pull Requests in a single series each appended a new entry to the end of `CHANGELOG.md`. Because every one of them inserted at the same position, the second Pull Request onward all produced a conflict on that file, even though the entries were unrelated and never contradicted each other. Every one of those conflicts was resolved by keeping all entries, but the work was repeated six times.

- Never append a new changelog entry to the end of `CHANGELOG.md`. Always insert it directly below the `<!-- ENTRI-BARU-SISIPKAN-DI-SINI -->` marker.
- The marker sits directly below the `## [Unreleased]` heading and above the block of `### Unreleased Update` entries. A new entry therefore lands above the existing ones, which preserves the newest-first order of that block.
- Re-verify this description against the real file whenever the changelog structure changes. This sentence was already wrong once, because it claimed the marker sits outside the `## [Unreleased]` heading when it sits inside it.
- The reason is not tidiness. Git handles several agents inserting at the same position automatically, because both sides are pure insertions with no contradictory lines, so the merge succeeds without a conflict marker. Appending to the end of a file always conflicts, because each branch adds different content at the identical tail position.
- Before adding an entry, check that the marker exists. If it does not, add it as its own commit before creating any branch that will add entries.
- If several Pull Requests are open at the same time and each must add a changelog entry, the insertion rule above removes the need to serialize them. Do not create stacked branches or chain merges purely to avoid changelog conflicts.
- When resolving a `CHANGELOG.md` conflict, keep every entry from both sides. Entries from different Pull Requests are additive and never contradict. Never resolve a changelog conflict by dropping an entry.

## Planning and Progress Tracking

These rules exist because a detailed plan agreed in conversation disappears as soon as the session ends, and because finished work was never recorded anywhere that could be audited against the plan that produced it.

- `TODO.md` at the repository root is the single workspace for planned work. It uses Markdown task lists, and every planned item starts unchecked.
- After presenting a plan to the user, write that plan into `TODO.md` before starting implementation. The file must be detailed enough to execute from without re-reading the conversation.
- `TODO.md` uses three fixed sections, in this order:
  1. Active plans, one `###` heading per Pull Request, newest plan appended last.
  2. Deferred work, for anything that was raised but must not start yet.
  3. Known Issues, for problems that are deliberately recorded and not currently planned for a fix. Use plain bullets, not task checkboxes, so they are not read as queued work.
- Mark an item as done (`- [x]`) only in the same branch and the same Pull Request that delivers the work. Never tick a box in a separate or later commit, because that lets the file drift from the actual state of the code.
- Each Pull Request that carries planned work updates `TODO.md` in its own single-file commit, following the one-commit-per-file rule.
- An item only moves out of an Active plan when its Pull Request is merged. While the Pull Request is open the boxes stay ticked, because the work is delivered but not yet accepted.
- Planned work is tracked sequentially. Because ticking a box rewrites an existing line rather than inserting a new one, parallel branches touching the same unchecked item will conflict. Do not open parallel branches for planned work.
- When the user submits a new revision or improvement request, add it to `TODO.md` as a new section. Never overwrite or replace sections that are already there, and never renumber existing items. Earlier plans stay auditable.
- Boundaries between the root documents:
  - `TODO.md` holds planned work that is not yet done.
  - `CHANGELOG.md` holds user-facing release notes for merged work.
  - `worklog.md` holds a narrative of what was executed, in past tense.
  - `DEVIATIONS.md` holds decisions that depart from the specification documents. Never record a plain design change there.
- Write `TODO.md` content in Indonesian, matching the Language Style rules above.

## Delivery Rules

- Explain the planned scope before material changes when requirements are ambiguous.
- Report changed files, validation results, migration requirements, and any remaining risks.
- After every requested change is implemented, update `CHANGELOG.md` immediately without waiting for a separate reminder.
- Never replace existing `CHANGELOG.md` entries; append each new entry below the existing content and separate it with a Markdown divider.
- After every requested change is implemented, create the relevant focused GitHub Issue and Pull Request without waiting for a separate reminder.
- Keep the Issue and Pull Request scoped to the implemented change, link them together, and never merge the Pull Request; the project owner performs the merge.
- Use real multiline Markdown for GitHub issues and pull requests; do not submit literal `\\n` sequences.
- Do not create a release unless explicitly requested.

## GitHub Release Cadence

- Start counting the cadence from the first release tag created for Althentic (the project owner fills in this tag name here; until a tag exists, no cadence release is created). This tag is the starting point and does not count as a new Pull Request.
- After every five Pull Requests are merged into `main` since the previous release, create the next GitHub Release on the latest merge commit on `main`.
- Automatically bump the patch version for each cadence, for example `v1.1.2` becomes `v1.1.3`.
- Before creating a release, make sure that five Pull Requests have actually been merged since the previous tag, that `CHANGELOG.md` contains the corresponding entries, and that all relevant validations have passed.
- Create an annotated tag with the new version on the latest merge commit, push the tag to origin, then create the GitHub Release with the status published, not draft or prerelease.
- This release cadence does not replace hotfixes or other releases explicitly requested by the repository owner.

## GitHub Issue Rules

- Create an Issue for every bug, feature, or material behavior change that will be implemented.
- When a task contains multiple independently changeable files or scopes, create multiple focused Issues rather than one combined Issue; each Issue must describe only its own scope.
- Use a clear title with a type prefix, for example `fix:`, `feat:`, `docs:`, or `chore:`.
- Write the Issue body with real Markdown sections: `Masalah` or `Tujuan`, `Perilaku yang Diharapkan`, and `Acceptance Criteria`.
- Acceptance criteria must be concrete checkboxes and must describe observable behavior.
- Check existing open Issues before creating a new one to avoid duplicates.
- Keep Issue descriptions limited to the requested scope; do not add unrelated refactors.
- **Link Issues and Pull Requests in both directions, regardless of how many Pull Requests are involved.** A Pull Request closes an Issue with `Closes #<number>` in its body, and the Issue receives a comment naming the Pull Request that implements it. One Issue may be closed by more than one Pull Request, and every Pull Request that closes the same Issue must still reference that Issue number in its body.
- **Avoid `#<number>` references in files touched by a Pull Request, unless that Pull Request actually closes the referenced Issue.** GitHub links an Issue to a Pull Request from every `#<number>` reference in any file the Pull Request touches, not only from the added lines. Such references cause the Issue to be closed automatically when the Pull Request is merged, including Issues that belong to other Pull Requests and are merely mentioned in documentation. Write Issue numbers in documents without the hash sign, for example `Issue: number 266.`

## GitHub Issue Rules

- Create an Issue for every bug, feature, or material behavior change that will be implemented.
- When a task contains multiple independently changeable files or scopes, create multiple focused Issues rather than one combined Issue; each Issue must describe only its own scope.
- Use a clear title with a type prefix, for example `fix:`, `feat:`, `docs:`, or `chore:`.
- Write the Issue body with real Markdown sections: `Masalah` or `Tujuan`, `Perilaku yang Diharapkan`, and `Acceptance Criteria`.
- Acceptance criteria must be concrete checkboxes and must describe observable behavior.
- Check existing open Issues before creating a new one to avoid duplicates.
- Keep Issue descriptions limited to the requested scope; do not add unrelated refactors.
- **Link Issue dan Pull Request dua arah, berapa pun jumlah Pull Request-nya.** Pull Request menutup Issue lewat `Closes #<number>` di body-nya, dan Issue diberi komentar yang menyebut nomor Pull Request yang mengimplementasikannya. Satu Issue boleh ditutup oleh lebih dari satu Pull Request, dan setiap Pull Request yang menutup Issue yang sama tetap menyebut nomor Issue itu di body-nya.
- **Hindari rujukan `#<nomor>` pada file yang disentuh Pull Request, kecuali Issue itu memang ditutup oleh Pull Request tersebut.** GitHub menautkan Issue ke Pull Request dari setiap rujukan `#<nomor>` yang ada di file yang disentuh Pull Request, bukan hanya dari baris yang ditambahkan. Referensi seperti itu membuat Issue ditutup otomatis saat PR di-merge, termasuk Issue milik PR lain yang hanya disebut di dokumen. Nomor Issue di dalam dokumen ditulis tanpa tanda pagar, misalnya `Issue: nomor 266.`

## Branch and Commit Rules

- Start implementation branches from the latest `origin/main` whenever possible.
- Use a descriptive branch name such as `fix/manual-receipt-review` or `feat/cash-receipt`.
- Check `git status` before creating a branch, staging files, or committing.
- Stage only files belonging to the current task; preserve unrelated modifications and untracked user files.
- Use focused Conventional Commit messages with a type prefix, for example `fix:`, `feat:`, `docs:`, or `chore:`.
- Permanent user preference: always create one commit per changed file. Never group multiple changed files into a single commit unless the user explicitly approves grouping them for that task.
- When a task changes multiple files, the resulting commit count must reflect the number of changed files, even when the user does not repeat the request in the current message.
- Each commit should represent one coherent change and must not contain secrets, `.env`, generated files, logs, or unrelated formatting changes.
- Before pushing, verify `git diff --check` and run the relevant lint/build/test commands.
- Do not use destructive commands such as `git reset --hard`, `git checkout --`, or database reset commands without explicit approval.

## Pull Request Rules

- Check existing open PRs before creating a new PR for the same work.
- Create the PR from the implementation branch into `main`.
- A PR may contain many focused commits and should preserve the requested one-file-per-commit structure.
- Use a clear type-prefixed title matching the primary change.
- PR bodies must use real multiline Markdown with these sections:
  - `Ringkasan`
  - `Perubahan`
  - `Validasi`
  - `Dampak Data` or `Deployment Checklist` when relevant
- Link the related Issue with `Closes #<number>` or `Fixes #<number>` when the PR resolves it.
- State explicitly whether a database migration, environment-variable update, storage change, or manual deployment action is required.
- Do not claim a PR is ready until the branch is pushed and the checks have been reviewed.
- Always report the final Issue URL, PR URL, branch name, commit hash, and validation result to the user.
- The agent must never merge a PR. Only the user may merge it, even when all checks pass, unless the user explicitly changes this rule in a later instruction.

## Pull Request Conflict & Code Review Update Rules

- Before creating a new Pull Request, always fetch `origin/main` first and make sure your branch is based on the latest commit. If other Pull Requests are open, rebase onto or merge `origin/main` before pushing, so conflicts are resolved locally rather than on GitHub. After pushing, verify that the Pull Request is mergeable before proceeding.
- Every time a Pull Request is created, **replace** the entire contents of `docs/review/CODE_REVIEW.md` with a new review block for that Pull Request. If a single session produces multiple Pull Requests, stack the blocks in order (one block per Pull Request). In the next session, when a new Pull Request is created, replace the file entirely with the block for that new Pull Request.

## Code Review Documentation Rules

- After creating a Pull Request, always populate `docs/review/CODE_REVIEW.md` with one consolidated code review comment covering the entire PR, before reporting completion to the user.
- Replace the entire previous content of `CODE_REVIEW.md` for the new PR, unless another Pull Request from the same session is still open. In that case, keep the existing block and add a new block below it instead of replacing it.
- Fill in `PR:` and `Repo:` header fields with the current PR number and repository name.
- Use a single code box containing one comment for the whole PR, since GitHub's "Submit review" applies to all changed files at once, not per file.
- When more than one Pull Request is open at the same time, `CODE_REVIEW.md` holds one block per Pull Request. Each block repeats the `PR:`, `Repo:`, and `Status:` header fields, and its heading states the Pull Request number.
- A review comment belongs to exactly one Pull Request and must never be submitted to another. When reporting to the user, list every open Pull Request number together with the block number in `CODE_REVIEW.md` that belongs to it, so the correct one can be copied.
- The comment must be genuine: summarize real potential bugs, improvement suggestions, or technical questions found across the changed files. Never write filler or generic praise.
- Cover all changed files in the PR within that one comment, including documentation files such as `CHANGELOG.md`, `TODO.md`, and `docs/DESIGN.md`. Never limit review to code files only.
- For documentation files, review the content against reality rather than the code. For `CHANGELOG.md`, check that the entry states the real impact and does not omit a known risk. For `TODO.md`, check that the recorded plan matches what was actually done and does not point to files absent from the repository. For `DESIGN.md`, check that the written rule does not contradict the code and that no exception is left undocumented.
- Write the comment in Indonesian, matching the Language Style rules above.
- Mark the entry's `Status` as `[ ] belum dicopas` when written; never mark it as copied yourself, that is updated by the user.
- Do not modify any part of `CODE_REVIEW.md` outside the content inside the code boxes, per the rule already stated in that file. Adding a block for another open Pull Request, and adjusting that footer rule to match, are the only exceptions.
- This file is for the user's own internal documentation only; it does not affect GitHub's review scoring since the PR author cannot review their own PR.

## Worktree Completion Rules

- A worktree in `.worktrees/<name>` is a checkout of its own branch. Never merge or cherry-pick a worktree's branch directly into the root working directory's branch.
- When work in a worktree is ready, create a focused PR from that worktree's branch into `main`, following the existing GitHub Issue and Pull Request Rules above (one Issue, one linked PR, never merged by the agent).
- Each worktree gets its own separate PR. Do not combine multiple worktrees into a single PR, even if several are ready at the same time.
- Never merge a worktree's PR yourself; only the user merges it via GitHub.
- Only remove a worktree (`git worktree remove`) after its PR has been merged by the user. Never delete a worktree folder manually (`rm -rf`) and never remove a worktree while its PR is still open.
- If asked to "apply worktree changes to root," interpret this as: create/verify the PR for each worktree branch, not as merging files directly into the root branch.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

- **graphify** (`.agents/skills/graphify/SKILL.md`, or `.claude/skills/graphify/SKILL.md` when running in Claude Code) - any input to knowledge graph. Trigger: `/graphify`
  When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:

- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Skill Usage Rules

- Skills are available from three sources: `.agents/skills/` (general agents), `.claude/skills/` (Claude Code), and skills installed globally in the AI agent's own plugin or skill directory (for example Codex). A relevant skill may come from any of these sources, not only from the project folders.
- Before starting any task, check the available skills from all three sources and select every skill relevant to the task (for example UI work, React patterns, design system, code review, GitHub workflow, writing quality). Read each selected `SKILL.md` completely before execution and follow its applicable instructions throughout the task.
- Skills that are already marked as required elsewhere in this file stay required. This section adds to them and never replaces them.
- If the same skill exists in more than one location, use the project-local copy first. Do not run duplicate copies of the same skill.
- Do not load skills that are unrelated to the task. If no relevant skill exists, proceed with the normal rules in this file.
- A skill never overrides the rules in this file. If a skill instruction conflicts with `AGENTS.md` (for example a skill that suggests emoji, em-dash characters, or grouped commits), follow `AGENTS.md` and report the conflict to the user.
- In the final report, list which skills were used for the task.