# Production Verification Checklist

## Database

- [ ] `DATABASE_URL` is set in Vercel.
- [ ] `DATABASE_URL` uses the provider's pooled runtime connection when recommended.
- [ ] `DIRECT_URL` is available to the controlled Prisma migration environment when required.
- [ ] Preview deployments use a database or branch isolated from production.
- [ ] No real `.env` file or connection string is committed.
- [ ] Checked-in migrations were applied with `npm run db:deploy`.
- [ ] `npm run prisma:seed` completed successfully.
- [ ] Re-running the seed does not create duplicate records.
- [ ] `/api/data-source-health` reports `dataSource: "database"`.
- [ ] Database configured, reachable, and seeded values are `true`.
- [ ] Patch, building, equipment, and spell counts are non-zero.

## Application

- [ ] Data Manager shows `Data source: Database`.
- [ ] Current patch and verification statuses render.
- [ ] Source URLs open correctly.
- [ ] Calculator works without saved progress.
- [ ] Calculator uses manual saved progress.
- [ ] Calculator uses JSON-imported saved progress.
- [ ] Giant Arrow applies 2x damage against Air Defense.
- [ ] Earthquake calculations and diminishing repeats work.
- [ ] Other target results card works.

## Fallback And Safety

- [ ] App works locally without `DATABASE_URL`.
- [ ] Invalid database connectivity uses static fallback without crashing.
- [ ] Data Manager shows a friendly fallback explanation.
- [ ] Health and UI responses expose no credentials or raw errors.
- [ ] No Supercell login or extraction behavior exists.

## Release Checks

- [ ] `npm run prisma:generate` passes.
- [ ] `npm run lint` passes.
- [ ] `npm run typecheck` passes.
- [ ] `npm test` passes.
- [ ] `npm run build` passes.
