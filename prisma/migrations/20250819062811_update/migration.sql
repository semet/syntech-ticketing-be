/*
  Warnings:

  - You are about to drop the column `assigneeId` on the `issues` table. All the data in the column will be lost.
  - You are about to drop the column `reporterId` on the `issues` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."issues" DROP CONSTRAINT "issues_assigneeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."issues" DROP CONSTRAINT "issues_reporterId_fkey";

-- AlterTable
ALTER TABLE "public"."issues" DROP COLUMN "assigneeId",
DROP COLUMN "reporterId",
ADD COLUMN     "assigneeNickname" TEXT,
ADD COLUMN     "reporterNickname" TEXT;

-- AddForeignKey
ALTER TABLE "public"."issues" ADD CONSTRAINT "issues_reporterNickname_fkey" FOREIGN KEY ("reporterNickname") REFERENCES "public"."reporters"("nickname") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."issues" ADD CONSTRAINT "issues_assigneeNickname_fkey" FOREIGN KEY ("assigneeNickname") REFERENCES "public"."assignees"("nickname") ON DELETE SET NULL ON UPDATE CASCADE;
