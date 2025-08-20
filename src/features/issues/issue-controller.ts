import { Context } from 'hono'

import { prisma } from '@/utils/database'

export const IssueController = async (c: Context) => {
  const page = c.req.query('page')
    ? Number.parseInt(c.req.query('page') as string, 10)
    : 1
  const limit = c.req.query('limit')
    ? Number.parseInt(c.req.query('limit') as string, 10)
    : 10

  const whitelabel = c.req.query('whitelabel')
    ? (c.req.query('whitelabel') as string)
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
        ...(whitelabel ? { whitelabelId: whitelabel } : {}),
        ...(assignee ? { assigneeId: assignee } : {}),
        ...(reporter ? { reporterId: reporter } : {}),
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        title: true,
        description: true,
        link: true,
        status: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
        finishedAt: true,

        category: {
          select: {
            id: true,
            name: true,
          },
        },
        whitelabel: {
          select: {
            id: true,
            name: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
          },
        },
        reporter: {
          select: {
            id: true,
            name: true,
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
