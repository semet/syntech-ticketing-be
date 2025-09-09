import { eq } from 'drizzle-orm';
import { db } from '@/db/database'; // Your Drizzle database connection
import { issues, reporters, categories, whiteLabels, assignees, } from '@/db/schema';
import { broadcastIssueUpdate, getActiveConnectionCount, } from '@/features/issues/issue-stream-controller';
export const TestIssueController = async (c) => {
    c.header('Content-Type', 'text/event-stream');
    c.header('Cache-Control', 'no-cache');
    c.header('Connection', 'keep-alive');
    c.header('Access-Control-Allow-Origin', '*');
    c.header('Access-Control-Allow-Headers', 'Cache-Control');
    const body = await c.req.json();
    // Upsert reporter (manual upsert implementation)
    const existingReporter = await db
        .select()
        .from(reporters)
        .where(eq(reporters.id, body.messageOwnerUsername))
        .limit(1);
    if (existingReporter.length === 0) {
        await db.insert(reporters).values({
            id: body.messageOwnerUsername,
            name: body.messageOwnerUsername,
        });
    }
    // Create the issue
    const [createdIssue] = await db
        .insert(issues)
        .values({
        title: body.title,
        description: body.description,
        link: body.link,
        status: body.status,
        priority: body.priority,
        createdAt: new Date(body.messageDate),
        categoryId: '1', // Will be '3' for Uncategorized
        whitelabelId: body.whitelabel.id,
        reporterId: body.messageOwnerUsername,
    })
        .returning();
    // Get the created issue with relations
    const [createdIssueWithRelations] = await db
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
        .where(eq(issues.id, createdIssue.id))
        .limit(1);
    broadcastIssueUpdate({
        id: createdIssueWithRelations.id,
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
    }, 'created');
    return c.json({
        success: true,
        issueId: createdIssueWithRelations.id,
        message: 'Test issue created and broadcasted',
        activeConnections: getActiveConnectionCount(),
    });
};
//# sourceMappingURL=new-issue-controller.js.map