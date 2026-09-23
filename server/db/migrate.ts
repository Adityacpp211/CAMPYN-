import fs from 'fs';
import path from 'path';
import { dbClient, getDb } from './index';

export async function runMigrations(): Promise<void> {
  await getDb();

  // 1. Ensure migrations tracking table exists
  await dbClient.exec(`
    CREATE TABLE IF NOT EXISTS _schema_migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Fetch already applied migrations
  const { rows } = await dbClient.query<{ migration_name: string }>(
    `SELECT migration_name FROM _schema_migrations ORDER BY id ASC`
  );
  const appliedMigrations = new Set(rows.map((r) => r.migration_name));

  // 3. Scan database/migrations directory
  const migrationsDir = path.resolve(process.cwd(), 'database', 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    console.warn(`[Migration] Migrations directory not found at ${migrationsDir}`);
    return;
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  console.log(`[Migration] Found ${files.length} migration file(s). Applied: ${appliedMigrations.size}`);

  for (const file of files) {
    if (appliedMigrations.has(file)) {
      continue;
    }

    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    console.log(`[Migration] Applying migration: ${file}...`);
    try {
      await dbClient.exec(sql);
      await dbClient.query(
        `INSERT INTO _schema_migrations (migration_name) VALUES ($1)`,
        [file]
      );
      console.log(`[Migration] Migration ${file} successfully applied.`);
    } catch (err: any) {
      console.error(`[Migration] Error applying migration ${file}:`, err);
      throw err;
    }
  }
}

// Allow direct CLI invocation
if (process.argv[1]?.endsWith('migrate.ts') || process.argv[1]?.endsWith('migrate.js')) {
  runMigrations()
    .then(() => {
      console.log('[Migration] All migrations up to date.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Migration] Migration runner failed:', err);
      process.exit(1);
    });
}
