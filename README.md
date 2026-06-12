# Clash Damage Calculator

## Overview

Clash Damage Calculator is an unofficial Clash of Clans planning tool for
checking whether selected hero equipment and Earthquake Spells can destroy a
loaded building target.

The MVP uses PostgreSQL-backed game data when configured and keeps the local,
versioned TypeScript dataset as a seed and runtime fallback. It shows direct
damage, spell damage, remaining HP, overkill, source-by-source details, and the
minimum number of Earthquakes needed for a selected setup.

## Features

- Building damage calculator with target HP and level details
- Giant Arrow target multiplier support
- Equipment and spell damage breakdown
- Diminishing repeated Earthquake damage
- Minimum Earthquake calculation
- Other target results showing what else the selected combo can destroy
- Manual progress saved in the browser
- Optional user-provided JSON import with preview before saving
- Patch history, verification status, sources, and data coverage dashboard
- PostgreSQL game data with automatic static fallback
- Protected database admin editor for small manual corrections
- Admin-only official update checker for review-only blog post detection
- Patch draft creation from reviewed official update detections
- Responsive layouts for desktop and mobile

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Vitest
- Prisma ORM
- PostgreSQL
- `localStorage` for MVP progress persistence

## Getting Started

Requirements:

- Node.js
- npm

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The app runs with static fallback data when `DATABASE_URL` is not configured.

## Available Scripts

```bash
npm run dev       # Start the development server
npm run lint      # Run ESLint
npm run typecheck # Run TypeScript without emitting files
npm test          # Run the Vitest suite once
npm run build     # Create a production build
npm start         # Start the production server after building
npm run prisma:generate # Generate Prisma Client
npm run prisma:migrate  # Create/apply a development migration
npm run prisma:deploy   # Apply checked-in migrations in production
npm run prisma:seed     # Upsert static seed data into PostgreSQL
npm run db:deploy       # Alias for applying production migrations
npm run db:push         # Push the schema without creating a migration
npm run db:studio       # Open Prisma Studio
```

## Database Setup

1. Create a PostgreSQL database locally or with a provider such as Neon.
2. Copy `.env.example` to `.env`.
3. Replace `DATABASE_URL` with the runtime connection string. Set optional
   `DIRECT_URL` when the provider recommends a direct URL for Prisma migrations.
4. Generate Prisma Client, apply the schema, and seed the database:

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

For early local prototyping, `npm run db:push` can be used instead of a
migration. The seed is repeatable: definitions, levels, patches, and object ID
mappings are upserted and are not duplicated on subsequent runs.

Static data files remain in `src/data/game` as the source for seeding and as the
runtime fallback if the database is missing, empty, or unavailable.

### Vercel

- Add the pooled runtime `DATABASE_URL` under the Vercel project environment
  variables. Use `DIRECT_URL` for controlled Prisma migration commands when
  your provider supplies a separate direct connection.
- Run `npm run prisma:deploy` and `npm run prisma:seed` through a controlled
  deployment workflow before relying on database records in production.
- `postinstall` generates Prisma Client during deployment.
- The app continues with static fallback data if PostgreSQL cannot be reached.
- Verify deployment status at `/api/data-source-health` and `/data-manager`.
- Keep Vercel Preview deployments on a database or branch separate from
  production.

See [Database Deployment](docs/deployment.md) for the complete local and Vercel
runbook, and [Production Checklist](docs/production-checklist.md) before launch.

## Admin Data Editor

The protected editor at `/admin` is intended for the project owner or trusted
maintainers making small manual corrections. It supports patches, building HP
rows, equipment levels and special rules, spell levels, source URLs,
verification status, and notes.

The editor requires both a reachable database and a private access key:

```env
DATABASE_URL="postgresql://..."
ADMIN_ACCESS_KEY="use-a-strong-private-value"
```

- The access key is checked only on the server.
- Successful access creates a signed, httpOnly, same-site cookie scoped to
  `/admin`.
- Every mutation checks admin access again on the server.
- Static fallback files are read-only and are never changed by the editor.
- Invalid URLs, values, references, and special-rules JSON are rejected before
  database writes.
- Only level rows can be deleted in this phase, with confirmation.
- Bulk CSV import/export is available for curated stat-table updates.
- Never place credentials or private notes in public data fields.

For Vercel, add `ADMIN_ACCESS_KEY` and `DATABASE_URL` under Project Settings >
Environment Variables, then redeploy. Use a strong unique key and rotate it if
access is ever shared accidentally.

## Admin Bulk Import/Export

The protected `/admin/data/import-export` page supports database CSV workflows
for building HP rows, equipment levels, and spell levels.

- Admin access and a reachable database are required.
- Every CSV import is parsed, validated, and compared with current database
  rows before saving.
- The preview marks rows as create, update, unchanged, invalid, or skipped.
- Invalid rows are never saved.
- Rows marked `rejected` are intentionally skipped.
- A missing `verificationStatus` defaults to `needs-review`.
- Commit repeats parsing, validation, and comparison on the server and applies
  create/update rows in one transaction.
- Imports are limited to 1 MB and 5,000 data rows.
- Current database data and example templates can be downloaded as CSV.
- Static fallback files are not modified.
- This is for curated, admin-reviewed data only. The app does not fetch,
  scrape, or extract Clash of Clans data.

Building HP example:

```csv
buildingId,buildingName,townHallLevel,level,hp,isSupercharged,superchargeLevel,patchId,sourceUrl,verificationStatus,notes
scattershot,Scattershot,18,7,5800,false,,may-2026,https://example.com,needs-review,TH18 max defense
```

Equipment level example:

```csv
equipmentId,equipmentName,level,damage,healing,hpIncrease,abilityDescription,specialRules,patchId,sourceUrl,verificationStatus,notes
giant-arrow,Giant Arrow,18,1500,,,Shoots a giant arrow,"{""targetMultipliers"":[{""targetBuildingId"":""air-defense"",""multiplier"":2}]}",may-2026,https://example.com,verified,2x Air Defense rule
```

Spell level example:

```csv
spellId,spellName,level,damage,damagePercent,repeatDamageRule,patchId,sourceUrl,verificationStatus,notes
earthquake-spell,Earthquake Spell,5,,0.29,diminishing-odd-denominator,may-2026,https://example.com,needs-review,Percentage damage
```

## Official Update Checker

The protected `/admin/updates` page lets an authenticated admin manually check
configured official Clash of Clans public news sources.

- Requires `DATABASE_URL`, seeded update-source records, and
  `ADMIN_ACCESS_KEY`.
- Checks only the allowlisted official Supercell Clash of Clans blog.
- Runs on demand from the admin button; no scheduler is included.
- Uses a five-minute cooldown per source and a short server-side timeout.
- Saves detected post titles, official URLs, dates when available,
  classifications, and review statuses.
- The check operation itself does not update calculator stats, create patches,
  or create stat rows.
- Can hand a reviewed detection to the separate patch-draft workflow.
- Does not inspect the Clash of Clans app, packets, memory, emulators, or game
  files.
- Ignored results remain stored for review history.

Phase 11C will add a separate suggested stat-change review workflow.

## Patch Draft Creation

Authenticated admins can create a draft patch from an existing official update
checker result. This requires database access and never writes calculator stat
rows.

Workflow:

1. Check configured official sources from `/admin/updates`.
2. Review the detected title, date, type, and official source.
3. Select **Create Patch Draft**.
4. Open the linked draft in the existing Patch Editor.
5. Review the source and add or import stat changes separately.
6. Calculator data changes only when reviewed stat rows are applied through the
   existing admin workflows.

Draft creation:

- Sets verification status to `draft`.
- Keeps `isCurrent` false and leaves `verifiedAt` empty.
- Uses the detected official URL and published date when available.
- Adds generic category review hints without inventing exact changed stats.
- Prevents duplicate drafts for the same update result or official source URL.
- Does not create building, equipment, or spell definitions or level rows.

Phase 11C will add suggested stat-change review. Suggestions will remain
separate from calculator-active data until an admin approves them.

## Project Structure

```text
app/                         Next.js pages and global layout
components/                  Shared app shell components
src/components/admin/        Protected admin editor components
src/components/calculator/   Calculator inputs and results
src/components/progress/     Manual progress and JSON import UI
src/components/data-manager/ Patch and static-data dashboard
src/components/ui/           Reusable presentation components
prisma/                      Prisma schema and repeatable seed
src/data/game/               Versioned local game data
src/lib/admin/               Admin authentication, validation, queries, actions
src/lib/db/                  Server-only Prisma client setup
src/lib/game/                Calculations, mappings, data source, import, and audit
src/types/admin.ts            Admin input and validation types
src/types/game/              Game, calculator, import, and progress types
```

## Completed Development Phases

1. Project setup and responsive base layout
2. Static game data structure and object ID allowlist
3. Pure TypeScript damage calculation engine
4. Calculator UI
5. Manual progress setup with local storage
6. Optional JSON import with preview
7. Data Manager and patch tracking
7.5. Current verified gear, spell, and balance checkpoints
8. MVP polish, tests, and documentation
8.5. Other target results card
9. PostgreSQL-backed game data with static seed/fallback
9.5. Database deployment diagnostics and production verification
10. Protected admin data editor for manual database corrections
10.5. Protected CSV import/export for database stat tables
11A. Admin-only official update checker with saved review results
11B. Patch draft creation from reviewed official update detections

## Data Sources And Verification

Game values are loaded from PostgreSQL when a complete seeded dataset is
available. Values in `src/data/game` remain the versioned seed and fallback.
Entries are associated with patch IDs and source URLs when available. Official
Supercell patch and news pages are the preferred sources.

Definitions and level entries may be marked:

- `verified`: the stored value is backed by the recorded source.
- `partial`: only part of the item or level table is currently stored.
- `needs-review`: a retained seed or value still needs source verification.

The Data Manager shows the current patch, tracked changes, source links, and
coverage counts. Coverage counts describe stored level entries; they do not
claim that every in-game level is present.

## Data Limitations

- The dataset is intentionally incomplete.
- Missing levels are not inferred or filled with invented values.
- Newly changed stats may remain partial or needs-review until manually checked.
- Some catalog items are visible in the Data Manager but excluded from the
  calculator because their effects are not supported or their stats are
  incomplete.
- Calculator results depend on the accuracy of the active database or fallback
  data.
- The app does not inspect or extract data from the Clash of Clans game, app,
  packets, memory, emulators, or game files. The admin-only update checker reads
  configured official public Supercell news pages for post detection only.

## Manual Progress Setup

Manual setup lets users select the Town Hall, Giant Arrow, Rocket Backpack, and
Earthquake levels currently represented by calculator data. Saving manual
progress sets its source to `manual`.

Progress is stored only in the current browser under:

```text
clash-damage-calculator:user-progress:v1
```

The calculator also works without saved progress.

## Optional JSON Import

JSON import is optional. Users may voluntarily paste a village snapshot, preview
recognized values, review ignored IDs and warnings, and then choose whether to
save normalized progress.

- A preview is required before saving.
- Unknown IDs are skipped safely.
- Only allowlisted IDs are mapped.
- Detected levels must exist in calculator-enabled static data.
- JSON import continues to use the static object ID allowlist during Phase 9.
- Raw pasted JSON is not stored.
- Manual setup remains available before and after an import.
- Saving the manual form after an import changes the source back to `manual`.

## Privacy And Safety

- No Supercell login is required.
- Never enter a Supercell ID email, password, recovery code, or 2FA code.
- No pasted JSON is sent to an external API.
- Progress is saved locally in the browser.
- Clearing browser storage removes saved MVP progress.

## MVP Acceptance Checklist

- [x] Calculator works without saved progress.
- [x] Calculator uses manual saved progress as defaults.
- [x] Calculator uses JSON-imported saved progress as defaults.
- [x] Other target results work for available static building data.
- [x] Calculator and Data Manager use database data when available.
- [x] Static fallback keeps the app working without a database.
- [x] Non-sensitive data source health endpoint reports deployment status.
- [x] JSON import requires preview before save.
- [x] Data Manager shows the current patch and partial status.
- [x] About page includes the fan-content disclaimer.
- [x] No Supercell login is requested.
- [x] No scraping or extraction behavior exists.
- [x] Lint passes.
- [x] Production build passes.
- [x] Unit tests pass.

## Known Limitations

- Building HP coverage is small, so many target selections show a friendly
  missing-data state.
- Earthquake level 5 remains marked needs-review until a source is stored.
- Rocket Backpack level 24 remains an MVP compatibility seed marked
  needs-review.
- Storage immunity and other building-specific spell rules are not implemented.
- Fire Heart, Monolith Arrow, and event spells are not calculator sources.
- JSON import does not query database object mappings yet.
- The admin editor uses a single owner-managed access key rather than accounts
  or role-based authentication.
- Official update classifications are keyword-based hints for admin review and
  are not treated as verified stat data.
- Draft patches are review metadata only and do not change calculator results.
- Official API import is not implemented.

## Roadmap

- Phase 11C: Add suggested stat-change extraction and review
- Future: Consider official Clash API profile import where appropriate

## Disclaimer

This is an unofficial Clash of Clans calculator and is not endorsed by
Supercell.

Clash of Clans, Supercell, and associated names and marks belong to their
respective owners.
