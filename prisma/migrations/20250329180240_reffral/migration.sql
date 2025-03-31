/*
  Warnings:

  - A unique constraint covering the columns `[refId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `coins` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `refId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "coins" INTEGER NOT NULL,
ADD COLUMN     "refId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_refId_key" ON "User"("refId");
