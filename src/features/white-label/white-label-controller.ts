import { Context } from 'hono'

import { prisma } from '@/utils/database'

export const WhiteLabelController = async (c: Context) => {
  const whiteLabels = await prisma.whiteLabel.findMany({
    orderBy: {
      name: 'asc',
    },
  })
  return c.json({
    data: whiteLabels,
  })
}
