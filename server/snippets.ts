import { randomUUID } from 'node:crypto'
import type { QueryResultRow } from 'pg'
import { database } from './database.js'
import { ApiError } from './types.js'

const MAX_SNIPPETS_PER_USER = 30

interface SnippetRow extends QueryResultRow {
  id: string
  name: string
  language: 'typescript' | 'javascript'
  code: string
  created_at: Date | string
  updated_at: Date | string
}

export interface SnippetInput {
  name: string
  language: SnippetRow['language']
  code: string
}

function isoDate(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

function mapSnippet(row: SnippetRow) {
  return {
    id: row.id,
    name: row.name,
    language: row.language,
    code: row.code,
    createdAt: isoDate(row.created_at),
    updatedAt: isoDate(row.updated_at),
  }
}

export async function listSnippets(userId: string) {
  const result = await database.query<SnippetRow>(
    `SELECT id, name, language, code, created_at, updated_at
     FROM code_snippets
     WHERE user_id = $1
     ORDER BY updated_at DESC, id ASC`,
    [userId],
  )
  return result.rows.map(mapSnippet)
}

export async function findSnippet(userId: string, snippetId: string) {
  const result = await database.query<SnippetRow>(
    `SELECT id, name, language, code, created_at, updated_at
     FROM code_snippets
     WHERE id = $1 AND user_id = $2`,
    [snippetId, userId],
  )
  return result.rows[0] ? mapSnippet(result.rows[0]) : null
}

export async function createSnippet(userId: string, input: SnippetInput) {
  const client = await database.connect()
  try {
    await client.query('BEGIN')
    await client.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [userId])
    const countResult = await client.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM code_snippets WHERE user_id = $1',
      [userId],
    )
    if (Number(countResult.rows[0]?.count ?? 0) >= MAX_SNIPPETS_PER_USER) {
      throw new ApiError(
        409,
        `最多保存 ${MAX_SNIPPETS_PER_USER} 个片段，请先删除不再需要的内容。`,
        'SNIPPET_LIMIT_REACHED',
      )
    }
    const result = await client.query<SnippetRow>(
      `INSERT INTO code_snippets (id, user_id, name, language, code)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, language, code, created_at, updated_at`,
      [randomUUID(), userId, input.name, input.language, input.code],
    )
    await client.query('COMMIT')
    return mapSnippet(result.rows[0]!)
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function updateSnippet(userId: string, snippetId: string, input: SnippetInput) {
  const result = await database.query<SnippetRow>(
    `UPDATE code_snippets
     SET name = $3, language = $4, code = $5, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND user_id = $2
     RETURNING id, name, language, code, created_at, updated_at`,
    [snippetId, userId, input.name, input.language, input.code],
  )
  if (!result.rows[0]) throw new ApiError(404, '代码片段不存在。', 'SNIPPET_NOT_FOUND')
  return mapSnippet(result.rows[0])
}

export async function deleteSnippet(userId: string, snippetId: string) {
  const result = await database.query(
    'DELETE FROM code_snippets WHERE id = $1 AND user_id = $2 RETURNING id',
    [snippetId, userId],
  )
  if (!result.rowCount) throw new ApiError(404, '代码片段不存在。', 'SNIPPET_NOT_FOUND')
}
