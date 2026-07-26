// @vitest-environment node

import {
  APIConnectionError,
  APIConnectionTimeoutError,
  AuthenticationError,
  BadRequestError,
  NotFoundError,
} from '@anthropic-ai/sdk'
import { mapAiUpstreamError } from './aiErrors.js'

const headers = new Headers()

describe('AI upstream error mapping', () => {
  it('maps upstream HTTP errors to actionable configuration messages', () => {
    const authentication = new AuthenticationError(401, {}, undefined, headers)
    const badRequest = new BadRequestError(400, {}, undefined, headers)
    const notFound = new NotFoundError(404, {}, undefined, headers)

    expect(mapAiUpstreamError(authentication)).toMatchObject({ status: 401, code: 'AI_AUTH_FAILED' })
    expect(mapAiUpstreamError(badRequest)).toMatchObject({ status: 400, code: 'AI_BAD_REQUEST' })
    expect(mapAiUpstreamError(notFound)).toMatchObject({ status: 404, code: 'AI_NOT_FOUND' })
  })

  it('distinguishes timeouts from other connection failures', () => {
    expect(mapAiUpstreamError(new APIConnectionTimeoutError())).toMatchObject({
      status: 504,
      code: 'AI_TIMEOUT',
    })
    expect(
      mapAiUpstreamError(new APIConnectionError({ cause: new Error('socket failed') })),
    ).toMatchObject({ status: 502, code: 'AI_CONNECTION_FAILED' })
    expect(mapAiUpstreamError(new Error('internal'))).toBeNull()
  })
})
