import { desc } from 'drizzle-orm'
import { Context } from 'hono'

import { db } from '@/db/database'
import { categories } from '@/db/schema'

export const CategoryController = async (c: Context) => {
  const category = await db
    .select()
    .from(categories)
    .orderBy(desc(categories.createdAt))

  return c.json({
    data: category,
  })
}
