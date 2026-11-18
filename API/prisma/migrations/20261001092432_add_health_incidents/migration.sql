/*
  Warnings:

  - A unique constraint covering the columns `[applicationId]` on the table `ApplicationHealth` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "ApplicationIncident" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "downAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recoveredAt" TIMESTAMP(3),

    CONSTRAINT "ApplicationIncident_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApplicationIncident_applicationId_downAt_idx" ON "ApplicationIncident"("applicationId", "downAt");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationHealth_applicationId_key" ON "ApplicationHealth"("applicationId");

-- AddForeignKey
ALTER TABLE "ApplicationIncident" ADD CONSTRAINT "ApplicationIncident_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
