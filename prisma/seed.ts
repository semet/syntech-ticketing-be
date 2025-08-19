/* eslint-disable unicorn/prefer-top-level-await */
/* eslint-disable unicorn/no-process-exit */
/* eslint-disable no-console */
import { faker } from '@faker-js/faker'

import { PrismaClient } from '@generated/prisma'

const prisma = new PrismaClient()

async function main() {
  // Create 10 WhiteLabels
  const whiteLabels = []
  for (let index = 1; index <= 10; index++) {
    const whiteLabel = await prisma.whiteLabel.create({
      data: {
        name: faker.company.name(),
      },
    })
    whiteLabels.push(whiteLabel)
  }

  // Create 10 Categories
  const categories = []
  for (let index = 0; index < 10; index++) {
    const category = await prisma.category.create({
      data: {
        name: faker.helpers.arrayElement([
          'Bug Report',
          'Feature Request',
          'Documentation',
          'Performance',
          'Security',
          'UI/UX',
          'Integration',
          'Testing',
          'Infrastructure',
          'Support',
        ]),
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
        nickname: nickname,
        email: faker.internet.email({ firstName, lastName }),
      },
    })
    reporters.push(reporter)
  }

  // Create 10 Assignees
  const assignees = []
  const usedAssigneeNicknames = new Set()

  for (let index = 1; index <= 10; index++) {
    const firstName = faker.person.firstName()
    const lastName = faker.person.lastName()

    // Generate unique nickname
    let nickname = `${firstName.toLowerCase()}_${lastName.toLowerCase()}`
    let counter = 1
    while (usedAssigneeNicknames.has(nickname)) {
      nickname = `${firstName.toLowerCase()}_${lastName.toLowerCase()}_${counter}`
      counter++
    }
    usedAssigneeNicknames.add(nickname)

    const assignee = await prisma.assignee.create({
      data: {
        name: `${firstName} ${lastName}`,
        nickname: nickname,
        email: faker.internet.email({ firstName, lastName }),
      },
    })
    assignees.push(assignee)
  }

  // Create 100 Issues
  const priorities = ['Low', 'Medium', 'High', 'Critical']
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
      `Creating issue ${index} with reporter: ${randomReporter.nickname}, assignee: ${randomAssignee.nickname}`,
    )

    await prisma.issue.create({
      data: {
        title: faker.lorem.sentence({ min: 3, max: 8 }),
        description: faker.lorem.paragraphs({ min: 2, max: 4 }),
        link: faker.internet.url(),
        status: randomStatus,
        priority: randomPriority,
        whiteLabelId: randomWhiteLabel.id,
        categoryId: randomCategory.id,
        reporterNickname: randomReporter.nickname, // This should never be null
        assigneeNickname: randomAssignee.nickname, // This should never be null
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
