import { desc, eq, and, count } from 'drizzle-orm'
import { Context } from 'hono'

import { db } from '@/db/database'
import {
  issues,
  categories,
  whiteLabels,
  assignees,
  reporters,
} from '@/db/schema'

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

  // Build where conditions
  const whereConditions = []
  if (whitelabel) whereConditions.push(eq(issues.whitelabelId, whitelabel))
  if (assignee) whereConditions.push(eq(issues.assigneeId, assignee))
  if (reporter) whereConditions.push(eq(issues.reporterId, reporter))

  const whereClause =
    whereConditions.length > 0 ? and(...whereConditions) : undefined

  // Calculate offset for pagination
  const offset = (page - 1) * limit

  // Get total count for pagination meta
  const [{ totalCount }] = await db
    .select({ totalCount: count() })
    .from(issues)
    .where(whereClause)

  // Get paginated issues with relations
  const issuesData = await db
    .select({
      id: issues.id,
      title: issues.title,
      description: issues.description,
      link: issues.link,
      status: issues.status,
      priority: issues.priority,
      createdAt: issues.createdAt,
      updatedAt: issues.updatedAt,
      finishedAt: issues.finishedAt,
      category: {
        id: categories.id,
        name: categories.name,
      },
      whitelabel: {
        id: whiteLabels.id,
        name: whiteLabels.name,
      },
      assignee: {
        id: assignees.id,
        name: assignees.name,
      },
      reporter: {
        id: reporters.id,
        name: reporters.name,
      },
    })
    .from(issues)
    .leftJoin(categories, eq(issues.categoryId, categories.id))
    .leftJoin(whiteLabels, eq(issues.whitelabelId, whiteLabels.id))
    .leftJoin(assignees, eq(issues.assigneeId, assignees.id))
    .leftJoin(reporters, eq(issues.reporterId, reporters.id))
    .where(whereClause)
    .orderBy(desc(issues.createdAt))
    .limit(limit)
    .offset(offset)

  // Calculate pagination meta
  const totalPages = Math.ceil(totalCount / limit)
  const meta = {
    currentPage: page,
    totalPages,
    totalCount,
    limit,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  }

  return c.json({
    data: issuesData,
    meta,
  })
}
