import type { NextFunction, Request, Response } from "express";
import type { AuthenticatedRequest } from "@/middlewares/auth-middleware";

type Role = "USER" | "ADMIN";

export class RoleValidatorMiddleware {
  public validate = (...allowedRoles: Role[]) =>
    (req: Request, res: Response, next: NextFunction) => {
      const { user } = req as AuthenticatedRequest;

      if (!user || user.type !== "access") {
        return res.status(401).json({
          code: 401,
          status: "error",
          message: "Authentication required",
        });
      }

      if (!allowedRoles.some((role) => role === user.role)) {
        return res.status(403).json({
          code: 403,
          status: "error",
          message: "You are not authorized to access this resource.",
        });
      }

      return next();
    };
}
