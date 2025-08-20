import { Context } from 'hono'

import { prisma } from '@/utils/database'

export const WhiteLabelController = async (c: Context) => {
  const whitelabels = await prisma.whitelabel.findMany({
    orderBy: {
      name: 'asc',
    },
  })
  return c.json({
    data: whitelabels,
  })
}
