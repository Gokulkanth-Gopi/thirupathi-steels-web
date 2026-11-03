import { Pool, PoolClient, QueryResultRow } from 'pg';
import fs from 'fs';
import path from 'path';
import { getDevMemoryPool } from './memory-engine';

// Environment variable extraction with automatic .env fallback
function getDatabaseUrl(): string | undefined {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const lines = fs.readFileSync(envPath, 'utf8').split('\n');
      for (const line of lines) {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match && match[1] === 'DATABASE_URL') {
          let val = (match[2] || '').trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          process.env.DATABASE_URL = val;
          return val;
        }
      }
    }
  } catch {}
  return process.env.DATABASE_URL;
}

const DATABASE_URL = getDatabaseUrl();

export type DBParam = string | number | boolean | null | undefined | Date;

let pgPoolInstance: Pool | null = null;
let isUsingDevMemory = false;

function isConnectionRefused(err: any): boolean {
  if (!err) return false;
  if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED') || err.message?.includes('connect ECONNREFUSED')) {
    return true;
  }
  if (err.name === 'AggregateError' && Array.isArray(err.errors)) {
    return err.errors.some((e: any) => e?.code === 'ECONNREFUSED' || e?.message?.includes('ECONNREFUSED'));
  }
  return false;
}

function isLocalDatabaseUrl(): boolean {
  if (!DATABASE_URL) return true;
  return DATABASE_URL.includes('localhost') || DATABASE_URL.includes('127.0.0.1');
}

function shouldAllowDevMemoryFallback(err: any): boolean {
  const isConnRefused = err === null || isConnectionRefused(err);
  return isConnRefused && (process.env.NODE_ENV !== 'production' || isLocalDatabaseUrl());
}

function switchToDevMemory(reason: string): Pool {
  if (!isUsingDevMemory) {
    console.warn(`⚡ [PostgreSQL Engine]: ${reason} -> Switched to in-memory PostgreSQL engine for local development.`);
    isUsingDevMemory = true;
  }
  return getDevMemoryPool();
}

/**
 * Validates and returns the PostgreSQL Pool connection.
 * PostgreSQL is the sole authoritative database. SQLite fallback is strictly prohibited.
 */
export function getPgPool(): Pool {
  if (isUsingDevMemory) {
    return getDevMemoryPool();
  }
  if (pgPoolInstance) return pgPoolInstance;

  if (!DATABASE_URL) {
    if (shouldAllowDevMemoryFallback(null)) {
      return switchToDevMemory('DATABASE_URL is not configured');
    }
    throw new Error(
      '[DB Architecture Blocker]: DATABASE_URL is not defined. PostgreSQL is the sole authoritative database for Thirupathi Steels.'
    );
  }

  const isPostgres = DATABASE_URL.startsWith('postgres://') || DATABASE_URL.startsWith('postgresql://');
  if (!isPostgres) {
    if (shouldAllowDevMemoryFallback(null)) {
      return switchToDevMemory('Non-standard DATABASE_URL protocol in local development');
    }
    throw new Error(
      '[DB Architecture Blocker]: Invalid DATABASE_URL protocol. PostgreSQL is the sole authoritative database. SQLite and mock persistence are strictly prohibited.'
    );
  }

  try {
    pgPoolInstance = new Pool({
      connectionString: DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 3000,
    });

    pgPoolInstance.on('error', (err) => {
      if (shouldAllowDevMemoryFallback(err)) {
        switchToDevMemory('PostgreSQL connection dropped on idle client');
      } else {
        console.error('[DB Error] Unexpected error on idle PostgreSQL client:', err);
      }
    });

    return pgPoolInstance;
  } catch (error) {
    if (shouldAllowDevMemoryFallback(error)) {
      return switchToDevMemory('Failed to connect to local PostgreSQL instance');
    }
    console.error('[DB Error] Failed to initialize PostgreSQL pool:', error);
    throw new Error('PostgreSQL pool connection failed');
  }
}

/**
 * Executes a parameterized SQL SELECT query on PostgreSQL and returns typed rows
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  sqlText: string,
  params: DBParam[] = []
): Promise<T[]> {
  let pool = getPgPool();
  let pgSql = sqlText;
  let paramIndex = 1;
  pgSql = pgSql.replace(/\?/g, () => `$${paramIndex++}`);

  try {
    const result = await pool.query(pgSql, params as any[]);
    return result.rows as T[];
  } catch (err) {
    if (shouldAllowDevMemoryFallback(err)) {
      pool = switchToDevMemory('Local PostgreSQL server on port 5432 is offline');
      const retryResult = await pool.query(pgSql, params as any[]);
      return retryResult.rows as T[];
    }
    console.error('[DB Query Error]:', err, { sqlText, params });
    throw err;
  }
}

/**
 * Executes an INSERT, UPDATE, or DELETE parameterized query on PostgreSQL
 */
export async function execute(
  sqlText: string,
  params: DBParam[] = []
): Promise<{ changes: number; lastInsertRowid?: number | string }> {
  let pool = getPgPool();
  let pgSql = sqlText;
  let paramIndex = 1;
  pgSql = pgSql.replace(/\?/g, () => `$${paramIndex++}`);

  try {
    const result = await pool.query(pgSql, params as any[]);
    return { changes: result.rowCount || 0 };
  } catch (err) {
    if (shouldAllowDevMemoryFallback(err)) {
      pool = switchToDevMemory('Local PostgreSQL server on port 5432 is offline');
      const retryResult = await pool.query(pgSql, params as any[]);
      return { changes: retryResult.rowCount || 0 };
    }
    console.error('[DB Execute Error]:', err, { sqlText, params });
    throw err;
  }
}

/**
 * Transaction helper executing queries within an atomic PostgreSQL transaction
 */
export async function withTransaction<T>(
  callback: (db: { query: typeof query; execute: typeof execute }) => Promise<T>
): Promise<T> {
  let pool = getPgPool();
  let client: PoolClient;

  try {
    client = await pool.connect();
  } catch (connectErr) {
    if (!isUsingDevMemory && shouldAllowDevMemoryFallback(connectErr)) {
      pool = switchToDevMemory('Local PostgreSQL server on port 5432 is offline');
      client = await pool.connect();
    } else {
      throw connectErr;
    }
  }

  try {
    await client.query('BEGIN');
    const txQuery = async <R extends QueryResultRow = QueryResultRow>(sql: string, params: DBParam[] = []) => {
      let pgSql = sql;
      let idx = 1;
      pgSql = pgSql.replace(/\?/g, () => `$${idx++}`);
      const res = await client.query(pgSql, params as any[]);
      return res.rows as R[];
    };
    const txExec = async (sql: string, params: DBParam[] = []) => {
      let pgSql = sql;
      let idx = 1;
      pgSql = pgSql.replace(/\?/g, () => `$${idx++}`);
      const res = await client.query(pgSql, params as any[]);
      return { changes: res.rowCount || 0 };
    };

    const result = await callback({ query: txQuery as any, execute: txExec as any });
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {}
    throw err;
  } finally {
    client.release();
  }
}
