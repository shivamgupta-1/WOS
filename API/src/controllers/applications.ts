import type { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma.ts";

const isValidFailureThreshold = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 10;

const isValidAwsInstanceId = (value: unknown): value is string =>
  typeof value === "string" && /^i-[a-fA-F0-9]{8,17}$/.test(value);

const getAllApplication = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const applications = await prisma.application.findMany();
    res.status(200).json({
      status: "success",
      data: applications,
    });
  } catch (error) {
    next(error);
  }
};

const getApplicationById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id;
    if (typeof id !== "string" || !id)
      return res
        .status(400)
        .json({ status: "failed", error: "Id is required" });

    const fetchedApplication = await prisma.application.findFirst({
      where: { id: id as string },
    });

    if (!fetchedApplication) {
      res
        .status(400)
        .json({ status: "failed", error: "Application doesn't exist" });
    }
    res.status(200).json({ status: 200, data: fetchedApplication });
  } catch (error) {
    next(error);
  }
};

const getApplicationIncidentHistory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id;
    const daysValue = req.query.days;
    const days = typeof daysValue === "string" ? Number(daysValue) : 1;

    if (typeof id !== "string" || !id)
      return res
        .status(400)
        .json({ status: "failed", error: "Id is required" });

    if (![1, 7, 30].includes(days)) {
      return res.status(400).json({
        status: "failed",
        error: "days must be one of 1, 7, or 30",
      });
    }

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const now = new Date();
    const application = await prisma.application.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        incidents: {
          where: {
            startAt: { lt: now },
            OR: [{ endAt: null }, { endAt: { gte: since } }],
          },
          orderBy: { startAt: "asc" },
          select: {
            id: true,
            status: true,
            startAt: true,
            endAt: true,
            errorMessage: true,
          },
        },
      },
    });

    if (!application) {
      return res
        .status(404)
        .json({ status: "failed", error: "Application doesn't exist" });
    }

    const history = application.incidents;
    res.status(200).json({
      status: "success",
      data: {
        application: { id: application.id, name: application.name },
        days,
        history,
        incidents: history.filter((period) => period.status === "DOWN"),
      },
    });
  } catch (error) {
    next(error);
  }
};

const createApplication = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, url, teamslink, email, description, domainId, failureThreshold, awsInstanceId } = req.body;
    if (failureThreshold !== undefined && !isValidFailureThreshold(failureThreshold)) {
      return res.status(400).json({
        status: "failed",
        error: "failureThreshold must be an integer between 1 and 10",
      });
    }
    if (awsInstanceId !== undefined && awsInstanceId !== null && !isValidAwsInstanceId(awsInstanceId)) {
      return res.status(400).json({
        status: "failed",
        error: "awsInstanceId must be a valid EC2 instance ID",
      });
    }
    const application = await prisma.application.create({
      data: {
        name,
        url,
        teamslink,
        email,
        description,
        domainId,
        awsInstanceId: awsInstanceId ?? null,
        ...(failureThreshold === undefined ? {} : { failureThreshold }),
      },
    });
    res.status(201).json({
      status: "success",
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

const updateApplication = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id;

    if (typeof id !== "string" || !id)
      return res
        .status(400)
        .json({ status: "failed", error: "Id is required" });

    const { name, url, teamslink, email, description, domainId, failureThreshold, awsInstanceId } = req.body;
    if (failureThreshold !== undefined && !isValidFailureThreshold(failureThreshold)) {
      return res.status(400).json({
        status: "failed",
        error: "failureThreshold must be an integer between 1 and 10",
      });
    }
    if (awsInstanceId !== undefined && awsInstanceId !== null && !isValidAwsInstanceId(awsInstanceId)) {
      return res.status(400).json({
        status: "failed",
        error: "awsInstanceId must be a valid EC2 instance ID",
      });
    }

    const application = await prisma.application.update({
      where: { id },
      data: {
        name,
        url,
        teamslink,
        email,
        description,
        domainId,
        ...(awsInstanceId === undefined ? {} : { awsInstanceId }),
        ...(failureThreshold === undefined ? {} : { failureThreshold }),
      },
    });

    res.status(200).json({
      status: "success",
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

const removeApplication = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id;
    if (typeof id !== "string" || !id)
      return res
        .status(400)
        .json({ status: "failed", error: "Id is required" });

    const deleteApplication = await prisma.application.delete({
      where: { id: id as string },
    });

    if (!deleteApplication) {
      res
        .status(400)
        .json({ status: "failed", error: "Application doesn't exist" });
    }

    res
      .status(200)
      .json({
        status: "success",
        message: `${deleteApplication.name} is deleted successfully`,
      });
  } catch (error) {
    next(error);
  }
};

export {
  getAllApplication,
  createApplication,
  updateApplication,
  removeApplication,
  getApplicationById,
  getApplicationIncidentHistory,
};
