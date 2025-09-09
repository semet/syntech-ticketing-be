import { desc } from 'drizzle-orm';
import { db } from '@/db/database';
import { categories } from '@/db/schema';
export const CategoryController = async (c) => {
    const category = await db
        .select()
        .from(categories)
        .orderBy(desc(categories.createdAt));
    return c.json({
        data: category,
    });
};
//# sourceMappingURL=category-controller.js.map