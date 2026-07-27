import type { Request, Response } from 'express'
import { Router } from 'express'
import { z } from 'zod'
import { requireUser } from '../auth.js'
import {
  createSnippet,
  deleteSnippet,
  findSnippet,
  listSnippets,
  updateSnippet,
} from '../snippets.js'

const router = Router()
const snippetIdSchema = z.string().uuid('片段 ID 格式无效。')
const snippetInputSchema = z.object({
  name: z.string().trim().min(1, '请输入片段名称。').max(80),
  language: z.enum(['typescript', 'javascript']),
  code: z.string().min(1, '没有可保存的代码。').max(50_000),
})

router.get('/', async (request: Request, response: Response) => {
  const user = await requireUser(request)
  response.json({ snippets: await listSnippets(user.id) })
})

router.get('/:id', async (request: Request, response: Response) => {
  const user = await requireUser(request)
  const snippet = await findSnippet(user.id, snippetIdSchema.parse(request.params.id))
  if (!snippet) {
    response.status(404).json({ error: { code: 'SNIPPET_NOT_FOUND', message: '代码片段不存在。' } })
    return
  }
  response.json({ snippet })
})

router.post('/', async (request: Request, response: Response) => {
  const user = await requireUser(request)
  const snippet = await createSnippet(user.id, snippetInputSchema.parse(request.body))
  response.status(201).json({ snippet })
})

router.put('/:id', async (request: Request, response: Response) => {
  const user = await requireUser(request)
  const snippet = await updateSnippet(
    user.id,
    snippetIdSchema.parse(request.params.id),
    snippetInputSchema.parse(request.body),
  )
  response.json({ snippet })
})

router.delete('/:id', async (request: Request, response: Response) => {
  const user = await requireUser(request)
  await deleteSnippet(user.id, snippetIdSchema.parse(request.params.id))
  response.status(204).end()
})

export { router as snippetsRouter }
