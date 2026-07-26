import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import compression from 'compression'
import cors from 'cors'
import express, { type ErrorRequestHandler } from 'express'
import { rateLimit } from 'express-rate-limit'
import helmet from 'helmet'
import { ZodError } from 'zod'
import { mapAiUpstreamError } from './aiErrors.js'
import { config } from './config.js'
import { aiRouter } from './routes/ai.js'
import { ApiError } from './types.js'

const app = express()
const currentDirectory = path.dirname(fileURLToPath(import.meta.url))
const webDirectory = path.resolve(currentDirectory, '../dist')
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1_000,
  limit: 180,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: { code: 'API_RATE_LIMITED', message: '请求过于频繁，请稍后再试。' } },
})

if (config.TRUST_PROXY) app.set('trust proxy', 1)

app.disable('x-powered-by')
app.use(
  helmet({
    contentSecurityPolicy:
      config.NODE_ENV === 'production'
        ? {
            directives: {
              'upgrade-insecure-requests': config.HTTPS_ONLY ? [] : null,
            },
          }
        : false,
    crossOriginEmbedderPolicy: false,
    strictTransportSecurity: config.HTTPS_ONLY ? undefined : false,
  }),
)
app.use(
  cors({
    origin: config.ALLOWED_ORIGIN.split(',').map((item) => item.trim()),
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'X-Claude-Key'],
  }),
)
app.use(compression())
app.use((request, response, next) => {
  if (request.header('sec-fetch-site') === 'cross-site') {
    response.status(403).json({ error: { code: 'CROSS_SITE_BLOCKED', message: '拒绝跨站请求。' } })
    return
  }
  next()
})
app.use('/api', apiLimiter)
app.use(express.json({ limit: '32kb', strict: true }))

app.get('/api/health', (_request, response) => response.json({ ok: true }))
app.use('/api/ai', aiRouter)

if (config.NODE_ENV === 'production') {
  app.use(express.static(webDirectory, { index: false, maxAge: '1d' }))
  app.get('/{*splat}', (_request, response) =>
    response.sendFile(path.join(webDirectory, 'index.html')),
  )
}

const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  const httpStatus =
    typeof error === 'object' && error !== null && 'status' in error
      ? Number(error.status)
      : undefined
  if (httpStatus === 413) {
    response
      .status(413)
      .json({ error: { code: 'PAYLOAD_TOO_LARGE', message: '请求内容不能超过 32 KB。' } })
    return
  }
  if (error instanceof SyntaxError && httpStatus === 400) {
    response
      .status(400)
      .json({ error: { code: 'INVALID_JSON', message: '请求内容不是有效的 JSON。' } })
    return
  }
  if (error instanceof ZodError) {
    response.status(400).json({
      error: {
        code: 'INVALID_REQUEST',
        message: error.issues[0]?.message ?? '请求参数无效。',
      },
    })
    return
  }
  if (error instanceof ApiError) {
    response.status(error.status).json({ error: { code: error.code, message: error.message } })
    return
  }

  const aiUpstreamError = mapAiUpstreamError(error)
  if (aiUpstreamError) {
    response.status(aiUpstreamError.status).json({
      error: { code: aiUpstreamError.code, message: aiUpstreamError.message },
    })
    return
  }
  if (request.path.startsWith('/api/ai/')) {
    console.error('Unhandled AI upstream error:', error)
    response.status(502).json({
      error: {
        code: 'AI_INVALID_UPSTREAM_RESPONSE',
        message: 'AI 上游响应不兼容，请确认它支持 Anthropic Messages API。',
      },
    })
    return
  }

  console.error(error)
  response.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '服务器处理失败。' } })
}

app.use(errorHandler)

app.listen(config.PORT, config.HOST, () => {
  console.log(`TypeRoom API listening on http://${config.HOST}:${config.PORT}`)
})
