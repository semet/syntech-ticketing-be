/* eslint-disable unicorn/prefer-top-level-await */
/* eslint-disable unicorn/no-process-exit */
/* eslint-disable no-console */
import 'dotenv/config' // Add this line to load .env file
import { faker } from '@faker-js/faker'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import { whitelabels } from '@/constants/whitelabels'
import {
  whiteLabels,
  categories,
  reporters,
  assignees,
  issues,
  type WhiteLabel,
  type Category,
  type Reporter,
  type Assignee,
} from '@/db/schema' // Adjust path to your schema file

// Explicit database connection
const connectionString =
  process.env.DATABASE_URL?.replace('?schema=public', '') ||
  'postgresql://danisemet:password@localhost:5432/ticketing-be'
const client = postgres(connectionString)
const database = drizzle(client)

const NO_SEED = false

async function main() {
  // Debug: Check DATABASE_URL
  console.log('DATABASE_URL:', process.env.DATABASE_URL)

  if (NO_SEED) {
    console.log('Skipping seed...')
    return
  }

  // Create WhiteLabels
  const createdWhiteLabels: WhiteLabel[] = []
  const availableWhitelabels = whitelabels

  for (const availableWhitelabel of availableWhitelabels) {
    const [whiteLabel] = await database
      .insert(whiteLabels)
      .values({
        id: availableWhitelabel.id.toString(),
        name: availableWhitelabel.name,
        whitelabelName: availableWhitelabel.name,
      })
      .returning()

    createdWhiteLabels.push(whiteLabel)
  }

  const createdCategories: Category[] = []
  const availableCategories = [
    { id: '1', name: 'Uncategorized' },
    { id: '2', name: 'Issue' },
    { id: '3', name: 'Improvement' },
  ]

  for (const availableCategory of availableCategories) {
    // Drizzle doesn't have upsert, so we'll handle it manually
    const existingCategory = await database
      .select()
      .from(categories)
      .where(eq(categories.id, availableCategory.id))
      .limit(1)

    let category: Category
    if (existingCategory.length > 0) {
      category = existingCategory[0]
    } else {
      const [newCategory] = await database
        .insert(categories)
        .values({
          id: availableCategory.id,
          name: availableCategory.name,
        })
        .returning()
      category = newCategory
    }

    createdCategories.push(category)
  }

  // Create Reporters
  const createdReporters: Reporter[] = []
  const usedReporterNicknames = new Set()

  for (let index = 1; index <= 10; index++) {
    const firstName = faker.person.firstName()
    const lastName = faker.person.lastName()

    let nickname = `${firstName.toLowerCase()}_${lastName.toLowerCase()}`
    let counter = 1
    while (usedReporterNicknames.has(nickname)) {
      nickname = `${firstName.toLowerCase()}_${lastName.toLowerCase()}_${counter}`
      counter++
    }
    usedReporterNicknames.add(nickname)

    const [reporter] = await database
      .insert(reporters)
      .values({
        name: `${firstName} ${lastName}`,
        id: 'tele' + faker.string.uuid(),
      })
      .returning()

    createdReporters.push(reporter)
  }

  // Create Assignees
  const createdAssignees: Assignee[] = []

  for (let index = 1; index <= 10; index++) {
    const firstName = faker.person.firstName()
    const lastName = faker.person.lastName()

    const [assignee] = await database
      .insert(assignees)
      .values({
        name: `${firstName} ${lastName}`,
        id: 'tele' + faker.string.uuid(),
      })
      .returning()

    createdAssignees.push(assignee)
  }

  // Create Issues
  const priorities = [1, 2, 3]
  const statuses = [1, 2, 3, 4]

  for (let index = 1; index <= 100; index++) {
    const randomWhiteLabel =
      createdWhiteLabels[Math.floor(Math.random() * createdWhiteLabels.length)]
    const randomCategory =
      createdCategories[Math.floor(Math.random() * createdCategories.length)]
    const randomReporter =
      createdReporters[Math.floor(Math.random() * createdReporters.length)]
    const randomAssignee =
      createdAssignees[Math.floor(Math.random() * createdAssignees.length)]
    const randomPriority =
      priorities[Math.floor(Math.random() * priorities.length)]
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]

    console.log(
      `Creating issue ${index} with reporter: ${randomReporter.name}, assignee: ${randomAssignee.name}`,
    )

    await database.insert(issues).values({
      title: faker.lorem.sentence({ min: 3, max: 8 }),
      description: faker.lorem.paragraphs({ min: 2, max: 4 }),
      reporterId: randomReporter.id,
      assigneeId: randomAssignee.id,
      link: faker.internet.url(),
      status: randomStatus,
      priority: randomPriority,
      whitelabelId: randomWhiteLabel.id,
      categoryId: randomCategory.id,
      finishedAt: randomStatus === 4 ? faker.date.past() : null,
    })
  }

  console.log('Seeding completed successfully!')
  console.log('Created:')
  console.log(`- ${createdWhiteLabels.length} WhiteLabels`)
  console.log(`- ${createdCategories.length} Categories`)
  console.log(`- ${createdReporters.length} Reporters`)
  console.log(`- ${createdAssignees.length} Assignees`)
  console.log('- 100 Issues')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await client.end()
  })
