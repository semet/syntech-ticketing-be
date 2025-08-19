import { Hono } from 'hono'

import { AssigneeController } from '@/features/assignee/assignee-controller'
import { CategoryController } from '@/features/category/category-controller'
import { IssueController } from '@/features/issues/issue-controller'
import { IssueStreamController } from '@/features/issues/issue-stream-controller'
import { ReporterController } from '@/features/reporter/reporter-controller'
import { WhiteLabelController } from '@/features/white-label/white-label-controller'

const r = new Hono()

r.get('/issues', IssueController)
r.get('/stream/issues', IssueStreamController)
r.get('/white-labels', WhiteLabelController)
r.get('/category', CategoryController)
r.get('/assignee', AssigneeController)
r.get('/reporter', ReporterController)

export { r as mainRouter }
