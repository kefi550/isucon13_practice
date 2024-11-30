import { MiddlewareHandler } from 'hono'
import { HonoEnvironment } from '../types/application.js'
import { defaultSessionExpiresKey, defaultUserIDKey } from '../contants.js'

export const verifyUserSessionMiddleware: MiddlewareHandler<
  HonoEnvironment
> = async (c, next) => {
  const session = c.get('session')

  const sessionExpires = session.get(defaultSessionExpiresKey)
  if (typeof sessionExpires !== 'number') {
    return c.text('failed to get EXPIRES value from session', 403)
  }
  if (typeof session.get(defaultUserIDKey) !== 'number') {
    return c.text('failed to get USERID value from session', 403)
  }
  if (Date.now() > sessionExpires) {
    return c.text('session has expired', 403)
  }
  await next()
}
