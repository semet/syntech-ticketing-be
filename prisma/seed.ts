/* eslint-disable unicorn/prefer-top-level-await */
/* eslint-disable unicorn/no-process-exit */
/* eslint-disable no-console */
import { faker } from '@faker-js/faker'

import { PrismaClient } from '@generated/prisma'

const prisma = new PrismaClient()
const NO_SEED = true

async function main() {
  if (NO_SEED === true) {
    console.log('Skipping seed...')
    return
  }
  // Create 10 WhiteLabels
  const whiteLabels = []
  for (let index = 1; index <= 10; index++) {
    const whiteLabel = await prisma.whitelabel.create({
      data: {
        name: faker.company.name(),
        whitelabelName: faker.company.name(),
        id: faker.string.uuid(),
      },
    })
    whiteLabels.push(whiteLabel)
  }

  // Create 10 Categories
  const categories = []
  for (let index = 0; index < 10; index++) {
    const category = await prisma.category.create({
      data: {
        name: faker.helpers.arrayElement(['Issue', 'Improvement']),
      },
    })
    categories.push(category)
  }

  // Create 10 Reporters
  const reporters = []
  const usedReporterNicknames = new Set()

  for (let index = 1; index <= 10; index++) {
    const firstName = faker.person.firstName()
    const lastName = faker.person.lastName()

    // Generate unique nickname
    let nickname = `${firstName.toLowerCase()}_${lastName.toLowerCase()}`
    let counter = 1
    while (usedReporterNicknames.has(nickname)) {
      nickname = `${firstName.toLowerCase()}_${lastName.toLowerCase()}_${counter}`
      counter++
    }
    usedReporterNicknames.add(nickname)

    const reporter = await prisma.reporter.create({
      data: {
        name: `${firstName} ${lastName}`,
        id: 'tele' + faker.string.uuid(),
      },
    })
    reporters.push(reporter)
  }

  // Create 10 Assignees
  const assignees = []

  for (let index = 1; index <= 10; index++) {
    const firstName = faker.person.firstName()
    const lastName = faker.person.lastName()

    const assignee = await prisma.assignee.create({
      data: {
        name: `${firstName} ${lastName}`,
        id: 'tele' + faker.string.uuid(),
      },
    })
    assignees.push(assignee)
  }

  // Create 100 Issues
  const priorities = [1, 2, 3]
  const statuses = [1, 2, 3, 4] // Corresponding to OPEN, IN_PROGRESS, SKIPPED, CLOSED

  for (let index = 1; index <= 100; index++) {
    const randomWhiteLabel =
      whiteLabels[Math.floor(Math.random() * whiteLabels.length)]
    const randomCategory =
      categories[Math.floor(Math.random() * categories.length)]
    const randomReporter =
      reporters[Math.floor(Math.random() * reporters.length)]
    const randomAssignee =
      assignees[Math.floor(Math.random() * assignees.length)]
    const randomPriority =
      priorities[Math.floor(Math.random() * priorities.length)]
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]

    console.log(
      `Creating issue ${index} with reporter: ${randomReporter.name}, assignee: ${randomAssignee.name}`,
    )

    await prisma.issue.create({
      data: {
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
      },
    })
  }

  console.log('Seeding completed successfully!')
  console.log('Created:')
  console.log('- 10 WhiteLabels')
  console.log('- 10 Categories')
  console.log('- 10 Reporters')
  console.log('- 10 Assignees')
  console.log('- 100 Issues')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
