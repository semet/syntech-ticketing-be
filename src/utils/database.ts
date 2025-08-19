import { pagination } from 'prisma-extension-pagination'

import { PrismaClient } from '@generated/prisma'

const prismaClientSingleton = () => {
  return new PrismaClient().$extends(pagination())
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

declare global {
  var prismaGlobal: PrismaClientSingleton | undefined
}

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma
}
