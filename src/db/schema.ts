import { createId } from '@paralleldrive/cuid2'
import { relations } from 'drizzle-orm'
import { pgTable, text, timestamp, integer } from 'drizzle-orm/pg-core'

// Tables
export const whiteLabels = pgTable('white_labels', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text('name').notNull(),
  whitelabelName: text('whitelabel_name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const categories = pgTable('categories', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const reporters = pgTable('reporters', {
  id: text('id').unique().notNull(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const assignees = pgTable('assignees', {
  id: text('id').unique().notNull(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const issues = pgTable('issues', {
  id: text('id').primaryKey(), // ← no default function
  title: text('title').notNull(),
  description: text('description').notNull(),
  link: text('link').notNull(),
  status: integer('status').default(1).notNull(),
  whitelabelId: text('whitelabel_id').notNull(),
  categoryId: text('category_id'),
  reporterId: text('reporter_id').notNull(),
  assigneeId: text('assignee_id'),
  priority: integer('priority').default(3).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  finishedAt: timestamp('finished_at'),
})

// Relations
export const whiteLabelsRelations = relations(whiteLabels, ({ many }) => ({
  issues: many(issues),
}))

export const categoriesRelations = relations(categories, ({ many }) => ({
  issues: many(issues),
}))

export const reportersRelations = relations(reporters, ({ many }) => ({
  issues: many(issues),
}))

export const assigneesRelations = relations(assignees, ({ many }) => ({
  issues: many(issues),
}))

export const issuesRelations = relations(issues, ({ one }) => ({
  whitelabel: one(whiteLabels, {
    fields: [issues.whitelabelId],
    references: [whiteLabels.id],
  }),
  category: one(categories, {
    fields: [issues.categoryId],
    references: [categories.id],
  }),
  reporter: one(reporters, {
    fields: [issues.reporterId],
    references: [reporters.id],
  }),
  assignee: one(assignees, {
    fields: [issues.assigneeId],
    references: [assignees.id],
  }),
}))

// Type exports (optional but recommended)
export type WhiteLabel = typeof whiteLabels.$inferSelect
export type NewWhiteLabel = typeof whiteLabels.$inferInsert

export type Category = typeof categories.$inferSelect
export type NewCategory = typeof categories.$inferInsert

export type Reporter = typeof reporters.$inferSelect
export type NewReporter = typeof reporters.$inferInsert

export type Assignee = typeof assignees.$inferSelect
export type NewAssignee = typeof assignees.$inferInsert

export type Issue = typeof issues.$inferSelect
export type NewIssue = typeof issues.$inferInsert
