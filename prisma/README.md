// FILE: prisma/README.md
/// ANCHOR: PrismaReadme
# Prisma & SQLite Setup

This schema models users/roles, masters (products, batches, godowns, suppliers, customers), purchase + sales invoices/items, stock ledger, e-invoice queue, and audit logs. Every release must ship with coherent Prisma migrations to keep desktop installs predictable.

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Run initial migration**
   ```bash
   npx prisma migrate dev --name init
   ```
   This creates/updates `prisma/dev.db` and regenerates Prisma Client for the Electron backend.

3. **Generate client after schema edits without migrating**
   ```bash
   npx prisma generate
   ```

4. **Inspect or patch data (optional)**
   ```bash
   npx prisma studio
   ```

> Tip: Migrations must remain additive—never drop columns in-place. Instead, add new tables/columns, migrate data in scripts, then deprecate old fields in a later release to avoid corrupting existing desktop installs.

