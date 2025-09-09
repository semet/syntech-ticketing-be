import { asc } from 'drizzle-orm';
import { db } from '@/db/database';
import { reporters } from '@/db/schema';
export const ReporterController = async (c) => {
    const reporter = await db
        .select()
        .from(reporters)
        .orderBy(asc(reporters.name));
    return c.json({
        data: reporter,
    });
};
//# sourceMappingURL=reporter-controller.js.map