/*
  Warnings:

  - You are about to drop the column `assignee` on the `issues` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `issues` table. All the data in the column will be lost.
  - You are about to drop the column `reporter` on the `issues` table. All the data in the column will be lost.
  - The `status` column on the `issues` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "public"."issues" DROP COLUMN "assignee",
DROP COLUMN "category",
DROP COLUMN "reporter",
ADD COLUMN     "assigneeId" TEXT,
ADD COLUMN     "reporterId" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "public"."reporters" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reporters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."assignees" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assignees_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reporters_email_key" ON "public"."reporters"("email");

-- CreateIndex
CREATE UNIQUE INDEX "assignees_email_key" ON "public"."assignees"("email");

-- AddForeignKey
ALTER TABLE "public"."issues" ADD CONSTRAINT "issues_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "public"."reporters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."issues" ADD CONSTRAINT "issues_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "public"."assignees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
