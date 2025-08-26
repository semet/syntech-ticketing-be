import { Context } from 'hono'

import {
  broadcastIssueUpdate,
  getActiveConnectionCount,
} from '@/features/issues/issue-stream-controller'
import { PrismaClient } from '@generated/prisma'

interface CreateIssueRequest {
  messageOwnerUsername: string
  reactionEmoji: string
  description: string
  link: string
  reactorUsername: string
  title: string
  messageDate: string
  messageId: number
  whitelabel: {
    id: string
    name: string
  }
  assignee: {
    id: string
    name: string
  }
  priority: number
  status: number
  category: {
    id: string
    name: string
  }
}

const prisma = new PrismaClient()

export const TestIssueController = async (c: Context) => {
  c.header('Content-Type', 'text/event-stream')
  c.header('Cache-Control', 'no-cache')
  c.header('Connection', 'keep-alive')
  c.header('Access-Control-Allow-Origin', '*')
  c.header('Access-Control-Allow-Headers', 'Cache-Control')

  const body: CreateIssueRequest = await c.req.json()

  await prisma.reporter.upsert({
    where: { id: body.messageOwnerUsername },
    update: {},
    create: {
      id: body.messageOwnerUsername,
      name: body.messageOwnerUsername,
    },
  })

  const createdIssue = await prisma.issue.create({
    data: {
      title: body.title,
      description: body.description,
      link: body.link,
      status: body.status,
      priority: body.priority,
      createdAt: new Date(body.messageDate),
      categoryId: '1', // Will be '3' for Uncategorized
      whitelabelId: body.whitelabel.id,
      reporterId: body.messageOwnerUsername,
    },
    include: {
      category: true,
      whitelabel: true,
      reporter: true,
      assignee: true,
    },
  })

  broadcastIssueUpdate(
    {
      id: body.messageId.toString(),
      category: {
        id: '1',
        name: 'Uncategorized',
      },
      status: body.status,
      priority: body.priority,
      title: body.title,
      link: body.link,
      whitelabel: {
        id: body.whitelabel.id,
        name: body.whitelabel.name,
      },
      reporter: {
        id: '',
        name: body.messageOwnerUsername,
      },
      assignee: null,
      description: body.description,
      createdAt: new Date(body.messageDate),
    },
    'created',
  )

  return c.json({
    success: true,
    issueId: createdIssue.id,
    message: 'Test issue created and broadcasted',
    activeConnections: getActiveConnectionCount(),
  })
}
