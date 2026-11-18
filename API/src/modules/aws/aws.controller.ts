import type { NextFunction, Request, Response } from "express";
import {
  AwsIntegrationError,
  getApplicationMetrics,
  getApplicationHealth,
} from "./aws.service.ts";

const instanceIdPattern = /^i-[a-fA-F0-9]{8,17}$/;

export async function getApplicationHealthController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const { instanceId } = req.params;

  if (typeof instanceId !== "string" || !instanceIdPattern.test(instanceId)) {
    res.status(400).json({
      status: "failed",
      error: "A valid EC2 instance ID is required.",
    });
    return;
  }

  try {
    const health = await getApplicationHealth(instanceId);
    res.status(200).json(health);
  } catch (error) {
    if (error instanceof AwsIntegrationError) {
      res.status(error.statusCode).json({
        status: "failed",
        error: error.message,
      });
      return;
    }
    next(error);
  }
}

export async function getApplicationMetricsController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const { instanceId } = req.params;

  if (typeof instanceId !== "string" || !instanceIdPattern.test(instanceId)) {
    res.status(400).json({
      status: "failed",
      error: "A valid EC2 instance ID is required.",
    });
    return;
  }

  try {
    const metrics = await getApplicationMetrics(instanceId);
    res.status(200).json(metrics);
  } catch (error) {
    if (error instanceof AwsIntegrationError) {
      res.status(error.statusCode).json({
        status: "failed",
        error: error.message,
      });
      return;
    }
    next(error);
  }
}
