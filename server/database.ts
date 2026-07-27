import type { Pool as PgPool } from 'pg'
import pg from 'pg'
import { config } from './config.js'

export type DatabasePool = Pick<PgPool, 'connect' | 'end' | 'query'>

async function createDatabasePool(): Promise<DatabasePool> {
  if (config.DATABASE_URL === 'memory:') {
    const { newDb } = await import('pg-mem')
    const memoryDatabase = newDb({ autoCreateForeignKeyIndices: true })
    const adapter = memoryDatabase.adapters.createPg()
    return new adapter.Pool() as unknown as DatabasePool
  }

  return new pg.Pool({
    connectionString: config.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    ssl: config.DATABASE_SSL ? { rejectUnauthorized: true } : undefined,
  })
}

export const database = await createDatabasePool()

export async function initializeDatabase(client: DatabasePool = database) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username VARCHAR(32) NOT NULL,
      username_normalized VARCHAR(64) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await client.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash CHAR(64) PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await client.query(`
    CREATE TABLE IF NOT EXISTS code_snippets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(80) NOT NULL,
      language VARCHAR(16) NOT NULL CHECK (language IN ('typescript', 'javascript')),
      code TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await client.query('CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id)')
  await client.query('CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at)')
  await client.query(
    'CREATE INDEX IF NOT EXISTS code_snippets_user_updated_idx ON code_snippets(user_id, updated_at DESC)',
  )
  await client.query('DELETE FROM sessions WHERE expires_at <= $1', [new Date()])
}
