ALTER TABLE "Application"
ADD COLUMN "failureThreshold" INTEGER NOT NULL DEFAULT 2;

ALTER TABLE "ApplicationHealth"
ADD COLUMN "consecutiveFailures" INTEGER NOT NULL DEFAULT 0;
