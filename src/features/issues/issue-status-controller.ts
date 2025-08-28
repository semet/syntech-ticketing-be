/* eslint-disable no-console */
import { eq } from 'drizzle-orm'
import { Context } from 'hono'

import { db } from '@/db/database' // Your Drizzle database connection
import {
  issues,
  categories,
  whiteLabels,
  assignees,
  reporters,
} from '@/db/schema'
import {
  broadcastIssueUpdate,
  getActiveConnectionCount,
} from '@/features/issues/issue-stream-controller'

interface UpdateStatusRequest {
  ticketId: string
  status: number
}

export const IssueStatusUpdateController = async (c: Context) => {
  try {
    c.header('Content-Type', 'application/json')
    c.header('Access-Control-Allow-Origin', '*')
    c.header('Access-Control-Allow-Headers', 'Content-Type')

    const body: UpdateStatusRequest = await c.req.json()

    // Find existing ticket with relations
    const existingTicket = await db
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
        whitelabelId: issues.whitelabelId,
        categoryId: issues.categoryId,
        reporterId: issues.reporterId,
        assigneeId: issues.assigneeId,
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
      .where(eq(issues.id, body.ticketId))
      .limit(1)

    if (existingTicket.length === 0) {
      return c.json(
        {
          success: false,
          message: 'Ticket not found',
        },
        404,
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      status: body.status,
      updatedAt: new Date(),
    }

    // Handle finishedAt based on status
    updateData.finishedAt = body.status === 3 ? new Date() : null

    await db.update(issues).set(updateData).where(eq(issues.id, body.ticketId))

    // Get the updated ticket with relations
    const updatedTicketWithRelations = await db
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
        whitelabelId: issues.whitelabelId,
        categoryId: issues.categoryId,
        reporterId: issues.reporterId,
        assigneeId: issues.assigneeId,
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
      .where(eq(issues.id, body.ticketId))
      .limit(1)

    const finalTicket = updatedTicketWithRelations[0]

    // Broadcast the update via SSE
    broadcastIssueUpdate(
      {
        id: finalTicket.id,
        title: finalTicket.title,
        status: finalTicket.status,
        description: finalTicket.description,
        priority: finalTicket.priority,
        createdAt: finalTicket.createdAt,
        link: finalTicket.link,
        category: finalTicket.category?.id
          ? {
              id: finalTicket.category.id,
              name: finalTicket.category.name,
            }
          : undefined,
        whitelabel: finalTicket.whitelabel?.id
          ? {
              id: finalTicket.whitelabel.id,
              name: finalTicket.whitelabel.name,
            }
          : undefined,
        assignee: finalTicket.assignee?.id
          ? {
              id: finalTicket.assignee.id,
              name: finalTicket.assignee.name,
            }
          : null,
        reporter: finalTicket.reporter?.id
          ? {
              id: finalTicket.reporter.id,
              name: finalTicket.reporter.name,
            }
          : undefined,
      },
      'updated',
    )

    return c.json({
      success: true,
      message: 'Ticket status updated successfully',
      ticket: finalTicket,
      activeConnections: getActiveConnectionCount(),
    })
  } catch (error) {
    console.error('Error updating ticket status:', error)

    return c.json(
      {
        success: false,
        message: 'Failed to update ticket status',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      500,
    )
  }
}
