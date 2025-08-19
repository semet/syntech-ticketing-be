import { Context } from 'hono'

import { prisma } from '@/utils/database'

export const CategoryController = async (c: Context) => {
  const category = await prisma.category.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  })
  return c.json({
    data: category,
  })
}
