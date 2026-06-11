# Production Verification Checklist

## Database

- [ ] `DATABASE_URL` is set in Vercel.
- [ ] `DATABASE_URL` uses the provider's pooled runtime connection when recommended.
- [ ] `DIRECT_URL` is available to the controlled Prisma migration environment when required.
- [ ] Preview deployments use a database or branch isolated from production.
- [ ] A strong `ADMIN_ACCESS_KEY` is set only in trusted environments.
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
- [ ] `/admin` rejects invalid access keys.
- [ ] `/admin` unlocks with the configured key.
- [ ] Admin edits update database-backed Calculator and Data Manager results.
- [ ] Bulk export and template routes reject unauthenticated requests.
- [ ] CSV preview and commit reject unauthenticated requests.
- [ ] Invalid CSV rows are shown in preview and are not saved.
- [ ] A reviewed test row updates database-backed public data as expected.

## Fallback And Safety

- [ ] App works locally without `DATABASE_URL`.
- [ ] Invalid database connectivity uses static fallback without crashing.
- [ ] Data Manager shows a friendly fallback explanation.
- [ ] Health and UI responses expose no credentials or raw errors.
- [ ] `ADMIN_ACCESS_KEY` is not exposed in HTML, client JavaScript, or APIs.
- [ ] Admin editing is disabled when `ADMIN_ACCESS_KEY` is absent.
- [ ] Static fallback data cannot be edited from the admin area.
- [ ] No Supercell login or extraction behavior exists.

## Release Checks

- [ ] `npm run prisma:generate` passes.
- [ ] `npm run lint` passes.
- [ ] `npm run typecheck` passes.
- [ ] `npm test` passes.
- [ ] `npm run build` passes.
