import { asc } from 'drizzle-orm';
import { db } from '@/db/database';
import { whiteLabels } from '@/db/schema';
export const WhiteLabelController = async (c) => {
    const whitelabels = await db
        .select()
        .from(whiteLabels)
        .orderBy(asc(whiteLabels.name));
    return c.json({
        data: whitelabels,
    });
};
//# sourceMappingURL=white-label-controller.js.map