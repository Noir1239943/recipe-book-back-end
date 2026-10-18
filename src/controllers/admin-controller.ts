import type { Request, Response } from "express";
import { getDashboardService } from "@/services/admin";
import { dashboardQuerySchema } from "@/schema/admin-schema";

export class AdminController {
  public getDashboard = async (req: Request, res: Response) => {
    const { query } = dashboardQuerySchema.parse({ query: req.query });
    const result = await getDashboardService(Number(query.days ?? "30"));
    return res.status(result.code).json(result);
  };
}
