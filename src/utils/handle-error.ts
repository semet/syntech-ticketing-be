import type { Context } from 'hono'
import type { HTTPResponseError } from 'hono/types'

export const handleError = (error: Error | HTTPResponseError, c: Context) => {
  // eslint-disable-next-line no-console
  console.error('Error occurred:', error)
  return c.json({ error: 'Internal Server Error' }, 500)
}
