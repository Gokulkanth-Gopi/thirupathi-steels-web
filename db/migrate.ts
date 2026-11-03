import fs from 'fs';
import path from 'path';
import { execute, query } from '../lib/db';

async function runMigration() {
  console.log('🔄 Running Thirupathi Steels PostgreSQL database migrations...');

  // Ensure migrations tracking table exists
  await execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(100) PRIMARY KEY,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const migrationsDir = path.resolve(process.cwd(), 'db/migrations');
  if (!fs.existsSync(migrationsDir)) {
    console.log('No migrations directory found.');
    return;
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const appliedRows = await query<{ version: string }>('SELECT version FROM schema_migrations');
  const appliedSet = new Set(appliedRows.map((r) => r.version));

  let count = 0;
  for (const file of files) {
    if (appliedSet.has(file)) {
      console.log(`  ⏭️  Skipping already applied migration: ${file}`);
      continue;
    }

    console.log(`  ▶️  Applying migration: ${file}...`);
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    // Split SQL by semicolon, filtering out empty comments/statements
    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      await execute(statement);
    }

    await execute('INSERT INTO schema_migrations (version) VALUES (?)', [file]);
    console.log(`  ✅ Applied migration: ${file}`);
    count++;
  }

  console.log(`\n🎉 Migrations complete. Applied ${count} new migration(s).`);
}

runMigration()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  });
