import { Context } from 'hono'

import { prisma } from '@/utils/database'

export const AssigneeController = async (c: Context) => {
  const assignee = await prisma.assignee.findMany({
    orderBy: {
      name: 'asc',
    },
  })
  return c.json({
    data: assignee,
  })
}
