import { asc } from 'drizzle-orm'
import { Context } from 'hono'

import { db } from '@/db/database'
import { whiteLabels } from '@/db/schema'

export const WhiteLabelController = async (c: Context) => {
  const whitelabels = await db
    .select()
    .from(whiteLabels)
    .orderBy(asc(whiteLabels.name))

  return c.json({
    data: whitelabels,
  })
}
