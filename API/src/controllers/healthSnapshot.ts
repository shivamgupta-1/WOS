import type { NextFunction, Request, Response } from "express";
import prisma from "../lib/prisma.ts";
import { saveHealthResult }  from "./saveHealthResult.ts"; // Adjust this path to where you defined the helper.

export const runHealthChecks = async () => {
  const applications = await prisma.application.findMany();

  const healthResults = await Promise.all(
    applications.map(async (application) => {
      const startedAt = performance.now();
      const url = /^https?:\/\//i.test(application.url)
        ? application.url
        : `http://${application.url}`;

      let responseTime: number;
      let statusCode: number | null;
      let status: "UP" | "DOWN";
      let errorMessage: string | null;

      try {
        const response = await fetch(url, {
          method: "GET",
          signal: AbortSignal.timeout(5000),
        });

        responseTime = Math.round(performance.now() - startedAt);
        statusCode = response.status;
        status = response.ok ? "UP" : "DOWN";
        errorMessage = response.ok
          ? null
          : response.statusText || `HTTP ${response.status}`;
      } catch (error) {
        console.error(`Health check failed for ${url}:`, error);
        responseTime = Math.round(performance.now() - startedAt);
        statusCode = null;
        status = "DOWN";
        errorMessage = error instanceof Error ? error.message : String(error);
      }

      return {
        application,
        result: { responseTime, statusCode, status, errorMessage },
      };
    }),
  );

  const snapshots = await Promise.all(
    healthResults.map(({ application, result }) =>
      saveHealthResult(application, result),
    ),
  );

  return snapshots;
};

export const getHealthSnapshot = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const snapshots = await runHealthChecks();

    res.status(200).json({
      status: "success",
      data: snapshots,
    });
  } catch (error) {
    next(error);
  }
};


export const getAllApplicationHealth = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const healthRecords = await prisma.applicationHealth.findMany({
      orderBy: { lastUpdated: "desc" },
    });

    res.status(200).json({
      status: "success",
      data: healthRecords,
    });
  } catch (error) {
    next(error);
  }
};
