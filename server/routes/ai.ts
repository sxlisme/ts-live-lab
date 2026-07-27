import type { Request, Response } from 'express'
import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import { z } from 'zod'
import { modelIdSchema, snippetNameRequestSchema } from '../aiValidation.js'
import {
  createClaudeClient,
  generateSnippetName,
  resolveClaudeConnection,
  reviewAnswer,
} from '../claude.js'
import { config } from '../config.js'
import { ApiError } from '../types.js'

const router = Router()
const reviewSchema = z.object({
  model: modelIdSchema,
  baseUrl: z.string().min(1).max(500).optional(),
  question: z.string().min(1).max(3_000),
  questionType: z.string().min(1).max(40),
  keyPoints: z.array(z.string().min(1).max(300)).max(12),
  answer: z.string().min(1, '请先填写答案。').max(12_000),
})
const checkSchema = z.object({
  model: modelIdSchema,
  baseUrl: z.string().min(1).max(500).optional(),
})

const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1_000,
  limit: 12,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: '请求过于频繁，请稍后再试。' } },
})

function clientKey(request: Request) {
  const value = request.header('x-claude-key')
  if (!value) return undefined
  if (value.length > 300 || /[\r\n]/.test(value)) {
    throw new ApiError(400, 'AI API Key 格式无效。', 'INVALID_AI_KEY')
  }
  return value
}

router.get('/status', (_request, response) => {
  response.json({
    serverConfigured: Boolean(config.ANTHROPIC_API_KEY),
    allowClientKey: config.ALLOW_CLIENT_AI_KEY,
    allowClientBaseUrl: !config.ANTHROPIC_API_KEY && config.ALLOW_CLIENT_AI_BASE_URL,
    defaultModel: config.CLAUDE_MODEL,
    defaultBaseUrl: config.ANTHROPIC_BASE_URL.replace(/\/+$/, ''),
  })
})

router.post('/check', aiLimiter, async (request: Request, response: Response) => {
  const input = checkSchema.parse(request.body)
  const connection = await resolveClaudeConnection(clientKey(request), input.baseUrl)
  const claude = createClaudeClient(connection)
  try {
    const result = await claude.client.messages.create({
      model: input.model,
      max_tokens: 8,
      temperature: 0,
      messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
    })
    response.json({ ok: result.content.some((block) => block.type === 'text') })
  } finally {
    await claude.close()
  }
})

router.post('/review', aiLimiter, async (request: Request, response: Response) => {
  const input = reviewSchema.parse(request.body)
  const connection = await resolveClaudeConnection(clientKey(request), input.baseUrl)
  const result = await reviewAnswer({ ...input, ...connection })
  response.json({ review: result })
})

router.post('/snippet-name', aiLimiter, async (request: Request, response: Response) => {
  const input = snippetNameRequestSchema.parse(request.body)
  const connection = await resolveClaudeConnection(clientKey(request), input.baseUrl)
  const name = await generateSnippetName({ ...input, ...connection })
  response.json({ name })
})

export { router as aiRouter }
