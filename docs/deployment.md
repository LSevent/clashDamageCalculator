# Database Deployment

This app uses PostgreSQL through Prisma when `DATABASE_URL` is configured. If
the variable is missing, the database cannot be reached, or the database has no
complete game dataset, the app continues with the versioned static fallback.

## Local PostgreSQL Setup

1. Create a PostgreSQL database.
2. Copy `.env.example` to `.env`.
3. Replace `DATABASE_URL` with the application connection string. If your
   provider supplies separate pooled and direct URLs, also set `DIRECT_URL` for
   Prisma CLI migrations.
4. Install dependencies and prepare the database:

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

The seed uses upserts and can be run repeatedly without duplicating patches,
definitions, levels, or object ID mappings. A successful run prints the number
of records processed in every seed category.

Open these pages after setup:

- `http://localhost:3000/data-manager`
- `http://localhost:3000/api/data-source-health`

Both should report `Database`, a reachable database, seeded data, and non-zero
counts.

## Static Fallback Check

To verify fallback locally:

1. Stop the development server.
2. Remove or temporarily rename `.env`. Do not commit it.
3. Start the app with `npm run dev`.
4. Open `/data-manager` and `/api/data-source-health`.

Expected status:

- Data source: `Static fallback`
- Database configured: `No`
- Database reachable: `Unknown`
- Seeded data found: `No`
- Calculator and other-target results remain available

An invalid but present `DATABASE_URL` should report that the database is
configured but unreachable, then use static fallback without crashing.

## Vercel And Neon Setup

1. Create a Neon or other PostgreSQL database.
2. Obtain the pooled application connection string and, if provided, the
   direct migration connection string.
3. In Vercel, open **Project Settings > Environment Variables**.
4. Add `DATABASE_URL` for the environments that need database data. Add
   `DIRECT_URL` only where Prisma migration commands will run.
5. Redeploy so the server functions receive the new variable.

For Neon, use the pooled URL for the Vercel runtime and the direct URL for
Prisma CLI operations. The checked-in Prisma config prefers `DIRECT_URL` for
migrations and otherwise uses `DATABASE_URL`:

```bash
npm run db:deploy
npm run prisma:seed
```

Do not automatically run migrations or seeding on every Vercel build. Apply
them deliberately before relying on database-backed production results.
Use a separate database or branch for Vercel Preview deployments so preview
migrations and seed data cannot affect production.

## Production Verification

After deployment:

1. Open `/api/data-source-health`.
2. Confirm `dataSource` is `database`.
3. Confirm `databaseConfigured`, `databaseReachable`, and `seeded` are `true`.
4. Confirm patch, building, equipment, and spell counts are non-zero.
5. Open `/data-manager` and confirm the same status is displayed.
6. Open `/calculator` and verify Giant Arrow, Rocket Backpack, Earthquake, and
   other-target results still load.
7. Verify Giant Arrow applies 2x damage against Air Defense.
8. Verify manual and JSON-imported progress still provide calculator defaults.

## Security Notes

- Never commit `.env` or a real PostgreSQL connection string.
- `DATABASE_URL` is server-only and must never use a `NEXT_PUBLIC_` prefix.
- The health endpoint exposes only status booleans, timestamps, patch name, and
  aggregate counts.
- The endpoint does not return credentials, URLs, raw errors, or stack traces.
- Raw user-provided JSON remains local to the browser and is not sent to the
  database.
