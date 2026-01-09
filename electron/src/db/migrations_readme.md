// FILE: electron/src/db/migrations_readme.md
/// ANCHOR: ElectronMigrationsGuide
# Desktop Migration Workflow

Mediclone ships Prisma migrations with every release so that the embedded SQLite database inside `%APPDATA%/Mediclone/data/mediclone.db` always matches the app binaries. Follow this flow whenever schema changes are introduced:

1. **Author migrations during development**
   ```bash
   npx prisma migrate dev --name <feature-name>
   ```
   This updates `prisma/migrations/` and `prisma/dev.db`.

2. **Bundle migrations with the app**
   - `prisma/migrations/` stays in the repo (and build artifacts) so Electron can run `prisma migrate deploy` on first launch if needed.
   - The packaged app points Prisma to `%APPDATA%/Mediclone/data/mediclone.db` (see `prismaClient.ts`).

3. **Run migrations in production (optional headless)**
   ```bash
   npx prisma migrate deploy --schema=prisma/schema.prisma
   ```
   This command is safe to run multiple times; it only applies pending migrations.

4. **Diagnostics**
   ```bash
   npx prisma migrate status
   ```
   Use this when investigating customer machines to see whether their DB matches the expected migration history.

> Always incrementally evolve the schema. Never manually edit the SQLite file shipped to users—Prisma migrations are the single source of truth.

