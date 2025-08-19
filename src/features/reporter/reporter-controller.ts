import { Context } from 'hono'

import { prisma } from '@/utils/database'

export const ReporterController = async (c: Context) => {
  const reporter = await prisma.reporter.findMany({
    orderBy: {
      name: 'asc',
    },
  })
  return c.json({
    data: reporter,
  })
}
