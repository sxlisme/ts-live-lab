import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(8787),
  HOST: z.string().default('127.0.0.1'),
  TRUST_PROXY: z
    .string()
    .default('false')
    .transform((value) => value === 'true'),
  HTTPS_ONLY: z
    .string()
    .default('false')
    .transform((value) => value === 'true'),
  ALLOWED_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().default('memory:'),
  DATABASE_SSL: z
    .string()
    .default('false')
    .transform((value) => value === 'true'),
  ALLOW_EPHEMERAL_DATABASE: z
    .string()
    .default('false')
    .transform((value) => value === 'true'),
  SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(30),
  DAILY_REGISTRATION_LIMIT: z.coerce.number().int().min(1).max(1_000).default(10),
  MAX_REGISTERED_USERS: z.coerce.number().int().min(1).max(100_000).default(50),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_BASE_URL: z.string().url().default('https://api.anthropic.com'),
  CLAUDE_MODEL: z.string().default('claude-sonnet-4-20250514'),
  ALLOW_CLIENT_AI_KEY: z
    .string()
    .default('true')
    .transform((value) => value === 'true'),
  ALLOW_CLIENT_AI_BASE_URL: z
    .string()
    .default('true')
    .transform((value) => value === 'true'),
  AI_ALLOWED_BASE_URLS: z.string().default(''),
})

const parsed = envSchema
  .superRefine((value, context) => {
    if (
      value.NODE_ENV === 'production' &&
      value.DATABASE_URL === 'memory:' &&
      !value.ALLOW_EPHEMERAL_DATABASE
    ) {
      context.addIssue({
        code: 'custom',
        path: ['DATABASE_URL'],
        message: '生产环境必须配置持久化 PostgreSQL DATABASE_URL。',
      })
    }
  })
  .safeParse(process.env)
if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const config = parsed.data
