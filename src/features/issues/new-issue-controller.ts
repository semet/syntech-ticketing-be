import { Context } from 'hono'

import {
  broadcastIssueUpdate,
  getActiveConnectionCount,
} from '@/features/issues/issue-stream-controller'
import { PrismaClient } from '@generated/prisma'

interface CreateIssueRequest {
  messageOwnerUsername: string
  reactionEmoji: string
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

  const whitelabel = await prisma.whitelabel.upsert({
    where: { id: body.whitelabel.id },
    update: {
      name: body.whitelabel.name,
      updatedAt: new Date(),
    },
    create: {
      id: body.whitelabel.id,
      name: body.whitelabel.name,
      whitelabelName: body.whitelabel.name,
    },
  })

  console.log(body)

  broadcastIssueUpdate(
    {
      id: body.messageId.toString(),
      category: {
        id: body.category.id,
        name: body.category.name,
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
      assignee: {
        id: '',
        name: '',
      },
    },
    'created',
  )

  return c.json({
    success: true,
    message: 'Test issue created and broadcasted',
    issue: whitelabel,
    activeConnections: getActiveConnectionCount(),
  })
}
