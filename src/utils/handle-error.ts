import type { Context } from 'hono'
import type { HTTPResponseError } from 'hono/types'

export const handleError = (error: Error | HTTPResponseError, c: Context) => {
  return c.json({ error: 'Internal Server Error' }, 500)
}
