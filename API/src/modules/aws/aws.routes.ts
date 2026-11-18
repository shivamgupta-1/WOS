import { Router } from "express";
import {
  getApplicationHealthController,
  getApplicationMetricsController,
} from "./aws.controller.ts";

const awsRouter = Router();

awsRouter.get(
  "/application/:instanceId",
  getApplicationHealthController,
);
awsRouter.get(
  "/application/:instanceId/metrics",
  getApplicationMetricsController,
);

export default awsRouter;
