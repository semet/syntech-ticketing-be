/* eslint-disable no-console */
import { Context } from 'hono'

import {
  broadcastIssueUpdate,
  getActiveConnectionCount,
} from '@/features/issues/issue-stream-controller'
import { PrismaClient } from '@generated/prisma'

const prisma = new PrismaClient()

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

    const existingTicket = await prisma.issue.findUnique({
      where: { id: body.ticketId },
      include: {
        category: true,
        whitelabel: true,
        reporter: true,
        assignee: true,
      },
    })

    if (!existingTicket) {
      return c.json(
        {
          success: false,
          message: 'Ticket not found',
        },
        404,
      )
    }

    const updatedTicket = await prisma.issue.update({
      where: { id: body.ticketId },
      data: {
        status: body.status,
        updatedAt: new Date(),
        ...(body.status === 3 && { finishedAt: new Date() }),
        ...(body.status !== 3 && { finishedAt: null }),
      },
      include: {
        category: true,
        whitelabel: true,
        reporter: true,
        assignee: true,
      },
    })

    // Broadcast the update via SSE
    broadcastIssueUpdate(
      {
        id: updatedTicket.id,
        title: updatedTicket.title,
        status: updatedTicket.status,
        description: updatedTicket.description,
        priority: updatedTicket.priority,
        createdAt: updatedTicket.createdAt,
        link: updatedTicket.link,
        category: updatedTicket.category
          ? {
              id: updatedTicket.category.id,
              name: updatedTicket.category.name,
            }
          : undefined,
        whitelabel: updatedTicket.whitelabel
          ? {
              id: updatedTicket.whitelabel.id,
              name: updatedTicket.whitelabel.name,
            }
          : undefined,
        assignee: updatedTicket.assignee
          ? {
              id: updatedTicket.assignee.id,
              name: updatedTicket.assignee.name,
            }
          : null,
        reporter: updatedTicket.reporter
          ? {
              id: updatedTicket.reporter.id,
              name: updatedTicket.reporter.name,
            }
          : undefined,
      },
      'updated',
    )

    return c.json({
      success: true,
      message: 'Ticket status updated successfully',
      ticket: updatedTicket,
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
