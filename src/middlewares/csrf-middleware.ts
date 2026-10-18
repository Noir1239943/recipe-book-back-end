import type { NextFunction, Request, Response } from "express";
import type { AuthenticatedRequest } from "@/middlewares/auth-middleware";
import { verifyRefreshToken } from "@/lib/jwt";
import { validateRequest, csrfSessionCookieName, csrfTokenCookieName } from "@/lib/csrf";

export class CsrfMiddleware {
  // Run after AuthMiddleware: only successfully verified Bearer authentication can skip CSRF.
  public execute = (req: Request, res: Response, next: NextFunction) => {
    if ((req as AuthenticatedRequest).authMethod === "bearer") return next();
    return this.validate(req, res, next);
  };

  // Browsers fetch a CSRF token before signup/login. Cookie-free JSON clients can use credentials directly.
  public auth = (req: Request, res: Response, next: NextFunction) => {
    const browserRequest = req.get("origin") || req.get("referer") || req.get("sec-fetch-site")
      || req.cookies?.accessToken || req.cookies?.refreshToken
      || req.cookies?.[csrfSessionCookieName] || req.cookies?.[csrfTokenCookieName];
    if (!browserRequest && req.is("application/json")) return next();
    return this.validate(req, res, next);
  };

  // An access Bearer token does not bypass protection for a refresh token taken from cookies.
  public refreshToken = (req: Request, res: Response, next: NextFunction) => {
    const token = req.body?.refreshToken;
    if (!req.cookies?.accessToken && !req.cookies?.refreshToken
      && typeof token === "string" && verifyRefreshToken(token)) return next();
    return this.validate(req, res, next);
  };

  private validate(req: Request, res: Response, next: NextFunction) {
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
    if (validateRequest(req)) return next();
    return res.status(403).json({ code: 403, status: "error", message: "Invalid or missing CSRF token" });
  }
}
