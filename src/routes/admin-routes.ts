import { Router } from "express";
import { AuthMiddleware } from "@/middlewares/auth-middleware";
import { SchemaMiddleware } from "@/middlewares/schema-middleware";
import { RoleValidatorMiddleware } from "@/middlewares/role-validator-middleware";
import { AdminController } from "@/controllers/admin-controller";
import { dashboardQuerySchema } from "@/schema/admin-schema";

const router = Router();
const authMiddleware = new AuthMiddleware();
const schemaMiddleware = new SchemaMiddleware();
const adminController = new AdminController();
const roleValidatorMiddleware = new RoleValidatorMiddleware();

// ADMIN: stats, chart data and recent recipes for the Dashboard page.
router.get("/v1/get-dashboard", authMiddleware.execute, roleValidatorMiddleware.validate("ADMIN"), schemaMiddleware.validate(dashboardQuerySchema), adminController.getDashboard);

export default router;
