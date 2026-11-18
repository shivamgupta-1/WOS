DROP INDEX IF EXISTS "ApplicationIncident_applicationId_downAt_idx";
DROP INDEX IF EXISTS "ApplicationIncident_applicationId_startedAt_idx";

UPDATE "ApplicationIncident"
SET "downAt" = "startedAt",
    "recoveredAt" = "endedAt";

ALTER TABLE "ApplicationIncident"
ALTER COLUMN "downAt" SET NOT NULL,
ALTER COLUMN "downAt" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "ApplicationIncident"
DROP COLUMN "startedAt",
DROP COLUMN "endedAt";

ALTER TABLE "ApplicationIncident"
RENAME COLUMN "downAt" TO "startAt";

ALTER TABLE "ApplicationIncident"
RENAME COLUMN "recoveredAt" TO "endAt";

CREATE INDEX "ApplicationIncident_applicationId_startAt_idx"
ON "ApplicationIncident"("applicationId", "startAt");