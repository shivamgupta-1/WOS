/*
  Warnings:

  - You are about to drop the column `domainId` on the `ApplicationHealth` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `ApplicationHealth` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `ApplicationHealth` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ApplicationHealth" DROP COLUMN "domainId",
DROP COLUMN "name",
DROP COLUMN "url";
