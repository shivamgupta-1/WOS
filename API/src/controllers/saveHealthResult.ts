import type { Application } from "@prisma/client";
import prisma from "../lib/prisma.ts";
import {
  sendTeamAlert,
} from "../jobs/alerts.ts";


type HealthResult = {
  responseTime: number | null;
  statusCode: number | null;
  status: "UP" | "DOWN";
  errorMessage: string | null;
};

const healthSaveQueues = new Map<string, Promise<void>>();

const saveHealthResult = async (
  application: Application,
  result: HealthResult,
) => {
  const previousSave = healthSaveQueues.get(application.id) ?? Promise.resolve();
  let releaseSave!: () => void;
  const currentSave = new Promise<void>((resolve) => {
    releaseSave = resolve;
  });
  healthSaveQueues.set(application.id, currentSave);
  await previousSave;

  try {
    return await persistHealthResult(application, result);
  } finally {
    releaseSave();
    if (healthSaveQueues.get(application.id) === currentSave) {
      healthSaveQueues.delete(application.id);
    }
  }
};

const persistHealthResult = async (
  application: Application,
  result: HealthResult,
) => {
  const now = new Date();
  const { errorMessage, ...healthResult } = result;

  const { health, incidentStarted } = await prisma.$transaction(async (tx) => {
    const previousHealth = await tx.applicationHealth.findUnique({
      where: { applicationId: application.id },
    });
    const consecutiveFailures = result.status === "DOWN"
      ? (previousHealth?.consecutiveFailures ?? 0) + 1
      : 0;
    const confirmedStatus = result.status === "DOWN"
      ? consecutiveFailures >= application.failureThreshold
        ? "DOWN"
        : previousHealth?.status ?? "UNKNOWN"
      : "UP";

    const health = await tx.applicationHealth.upsert({
      where: { applicationId: application.id },
      create: {
        applicationId: application.id,
        ...healthResult,
        status: confirmedStatus,
        consecutiveFailures,
      },
      update: {
        ...healthResult,
        status: confirmedStatus,
        consecutiveFailures,
      },
    });

    const currentPeriod = await tx.applicationIncident.findFirst({
      where: {
        applicationId: application.id,
        endAt: null,
      },
      orderBy: { startAt: "desc" },
    });

    const periodChanged = confirmedStatus !== "UNKNOWN" && currentPeriod?.status !== confirmedStatus;
    const incidentStarted = confirmedStatus === "DOWN" && periodChanged;

    if (currentPeriod && periodChanged) {
      await tx.applicationIncident.update({
        where: { id: currentPeriod.id },
        data: {
          endAt: now,
        },
      });
    }

    if (periodChanged) {
      await tx.applicationIncident.create({
        data: {
          applicationId: application.id,
          status: confirmedStatus,
          startAt: now,
          errorMessage: confirmedStatus === "DOWN" ? errorMessage : null,
        },
      });
    }

    return { health, incidentStarted };
  }, { maxWait: 10_000 });

  if (incidentStarted) {
    void sendTeamAlert(application, {
      downAt: now,
      responseTime: result.responseTime,
      statusCode: result.statusCode,
    }).catch((error: unknown) => {
      console.error(`Alert failed for ${application.name}:`, error);
    });
  }

  return health;
};

export { saveHealthResult };