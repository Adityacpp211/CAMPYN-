import fs from 'fs';
import path from 'path';
import { dbClient, getDb } from './index';

export async function runMigrations(): Promise<void> {
  await getDb();
  const schemaPath = path.resolve(process.cwd(), 'database', 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  console.log('[Migration] Running database schema DDL...');
  try {
    await dbClient.exec(schemaSql);
    console.log('[Migration] Schema created successfully.');
  } catch (err: any) {
    // If table already exists or minor error, log details
    if (err.message && err.message.includes('already exists')) {
      console.log('[Migration] Tables already exist, migration check passed.');
    } else {
      console.error('[Migration] Migration error:', err);
      throw err;
    }
  }
}

// Allow direct CLI invocation
if (process.argv[1]?.endsWith('migrate.ts') || process.argv[1]?.endsWith('migrate.js')) {
  runMigrations()
    .then(() => {
      console.log('[Migration] Done.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Migration] Failed:', err);
      process.exit(1);
    });
}
