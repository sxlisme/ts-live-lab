import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(8787),
  HOST: z.string().default('127.0.0.1'),
  TRUST_PROXY: z
    .string()
    .default('false')
    .transform((value) => value === 'true'),
  ALLOWED_ORIGIN: z.string().default('http://localhost:5173'),
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

const parsed = envSchema.safeParse(process.env)
if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const config = parsed.data
