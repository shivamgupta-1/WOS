ALTER TABLE "ApplicationIncident"
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'DOWN',
ADD COLUMN "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "endedAt" TIMESTAMP(3);

UPDATE "ApplicationIncident"
SET "startedAt" = "downAt",
    "endedAt" = "recoveredAt";

ALTER TABLE "ApplicationIncident"
ALTER COLUMN "downAt" DROP NOT NULL,
ALTER COLUMN "downAt" DROP DEFAULT;

CREATE INDEX "ApplicationIncident_applicationId_startedAt_idx"
ON "ApplicationIncident"("applicationId", "startedAt");