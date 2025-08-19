/*
  Warnings:

  - Made the column `assigneeNickname` on table `issues` required. This step will fail if there are existing NULL values in that column.
  - Made the column `reporterNickname` on table `issues` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."issues" DROP CONSTRAINT "issues_assigneeNickname_fkey";

-- DropForeignKey
ALTER TABLE "public"."issues" DROP CONSTRAINT "issues_reporterNickname_fkey";

-- AlterTable
ALTER TABLE "public"."issues" ALTER COLUMN "assigneeNickname" SET NOT NULL,
ALTER COLUMN "reporterNickname" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."issues" ADD CONSTRAINT "issues_reporterNickname_fkey" FOREIGN KEY ("reporterNickname") REFERENCES "public"."reporters"("nickname") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."issues" ADD CONSTRAINT "issues_assigneeNickname_fkey" FOREIGN KEY ("assigneeNickname") REFERENCES "public"."assignees"("nickname") ON DELETE RESTRICT ON UPDATE CASCADE;
