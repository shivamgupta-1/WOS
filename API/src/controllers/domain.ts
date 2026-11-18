import type { NextFunction, Request, Response } from "express";
import prisma from "../lib/prisma.ts";

const getAllDomain = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const domains = await prisma.domain.findMany();
    res.status(200).json({
      status: "success",
      data: domains,
    });
  } catch (error) {
    next(error);
  }
};

const getDomainById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    if (!id)
      return res
        .status(400)
        .json({ status: "failed", error: "Id is required" });

    const fetchedDomain = await prisma.domain.findFirst({
      where: { id: id as string },
    });

    if (!fetchedDomain) {
      res.status(400).json({ status: "failed", error: "Domain doesn't exist" });
    }
    res.status(200).json({ status: 200, data: fetchedDomain });
  } catch (error) {
    next(error);
  }
};

const createDomain = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name } = req.body;
    const domain = await prisma.domain.create({
      data: {
        domainName: name,
      },
    });
    res.status(201).json({
      status: "success",
      data: domain,
    });
  } catch (error) {
    next(error);
  }
};

const updateDomain = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    if (!id)
      return res
        .status(400)
        .json({ status: "failed", error: "Id is required" });

    const { name } = req.body;

    const domain = await prisma.domain.update({
      where: { id: id as string },
      data: { domainName: name },
    });

    res.status(200).json({
      status: "success",
      data: domain,
    });
  } catch (error) {
    next(error);
  }
};

const removeDomain = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    if (!id)
      return res
        .status(400)
        .json({ status: "failed", error: "Id is required" });

    const deleteDomain = await prisma.domain.delete({
      where: { id: id as string },
    });

    if (!deleteDomain) {
      res.status(400).json({ status: "failed", error: "Domain doesn't exist" });
    }

    res
      .status(200)
      .json({
        status: "success",
        message: `${deleteDomain.domainName} is deleted successfully`,
      });
  } catch (error) {
    next(error);
  }
};

export { createDomain, updateDomain, removeDomain, getAllDomain, getDomainById };
