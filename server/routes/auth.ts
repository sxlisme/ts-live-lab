import type { Request, Response } from 'express'
import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import {
  clearSessionCookie,
  createSession,
  createUser,
  deleteRequestSession,
  REGISTRATION_UNAVAILABLE_MESSAGE,
  setSessionCookie,
  userForRequest,
  verifyUser,
} from '../auth.js'
import { credentialsSchema, normalizeUsername } from '../authValidation.js'

const router = Router()
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1_000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: { code: 'AUTH_RATE_LIMITED', message: '尝试次数过多，请稍后再试。' } },
})
const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1_000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: { code: 'REGISTRATION_UNAVAILABLE', message: REGISTRATION_UNAVAILABLE_MESSAGE },
  },
})

function noStore(response: Response) {
  response.setHeader('Cache-Control', 'no-store')
}

router.get('/session', async (request: Request, response: Response) => {
  noStore(response)
  const user = await userForRequest(request)
  if (!user) clearSessionCookie(response)
  response.json({ user })
})

router.post('/register', registrationLimiter, async (request: Request, response: Response) => {
  noStore(response)
  const input = credentialsSchema.parse(request.body)
  const usernameNormalized = normalizeUsername(input.username)
  const user = await createUser(input.username, usernameNormalized, input.password)
  const token = await createSession(user.id)
  setSessionCookie(response, token)
  response.status(201).json({ user })
})

router.post('/login', loginLimiter, async (request: Request, response: Response) => {
  noStore(response)
  const input = credentialsSchema.parse(request.body)
  const user = await verifyUser(normalizeUsername(input.username), input.password)
  const token = await createSession(user.id)
  setSessionCookie(response, token)
  response.json({ user })
})

router.post('/logout', async (request: Request, response: Response) => {
  noStore(response)
  await deleteRequestSession(request)
  clearSessionCookie(response)
  response.status(204).end()
})

export { router as authRouter }
