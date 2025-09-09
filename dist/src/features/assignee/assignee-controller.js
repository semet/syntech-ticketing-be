import { asc } from 'drizzle-orm';
import { db } from '@/db/database';
import { assignees } from '@/db/schema';
export const AssigneeController = async (c) => {
    const assignee = await db
        .select()
        .from(assignees)
        .orderBy(asc(assignees.name));
    return c.json({
        data: assignee,
    });
};
//# sourceMappingURL=assignee-controller.js.map