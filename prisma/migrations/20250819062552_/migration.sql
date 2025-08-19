/*
  Warnings:

  - A unique constraint covering the columns `[nickname]` on the table `assignees` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nickname]` on the table `reporters` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `nickname` to the `assignees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nickname` to the `reporters` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."assignees" ADD COLUMN     "nickname" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."reporters" ADD COLUMN     "nickname" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "assignees_nickname_key" ON "public"."assignees"("nickname");

-- CreateIndex
CREATE UNIQUE INDEX "reporters_nickname_key" ON "public"."reporters"("nickname");
