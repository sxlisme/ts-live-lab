import type { BuildInfo } from '@/types/build'

export const buildInfo: BuildInfo = Object.freeze({
  version: typeof __APP_VERSION__ === 'undefined' ? '0.0.0-dev' : __APP_VERSION__,
  builtAt:
    typeof __APP_BUILD_TIME__ === 'undefined' ? new Date(0).toISOString() : __APP_BUILD_TIME__,
  dependencies:
    typeof __APP_DEPENDENCIES__ === 'undefined' ? [] : __APP_DEPENDENCIES__,
})
