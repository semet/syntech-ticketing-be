import { Context } from 'hono'

import { prisma } from '@/utils/database'

export const IssueController = async (c: Context) => {
  const page = c.req.query('page')
    ? Number.parseInt(c.req.query('page') as string, 10)
    : 1
  const limit = c.req.query('limit')
    ? Number.parseInt(c.req.query('limit') as string, 10)
    : 10

  const whiteLabel = c.req.query('whiteLabel')
    ? (c.req.query('whiteLabel') as string)
    : undefined

  const assignee = c.req.query('assignee')
    ? (c.req.query('assignee') as string)
    : undefined

  const reporter = c.req.query('reporter')
    ? (c.req.query('reporter') as string)
    : undefined

  const [issues, meta] = await prisma.issue
    .paginate({
      where: {
        ...(whiteLabel ? { whiteLabelId: whiteLabel } : {}),
        ...(assignee ? { assigneeNickname: assignee } : {}),
        ...(reporter ? { reporterNickname: reporter } : {}),
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        whiteLabel: {
          select: {
            id: true,
            name: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
    .withPages({
      limit,
      page,
    })
  return c.json({
    data: issues,
    meta,
  })
}
