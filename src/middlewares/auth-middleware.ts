import { NextFunction, Request, Response } from "express";
import { verifyAccessToken, JwtPayload } from "@/lib/jwt";

export type AuthenticatedRequest = Request & { user?: JwtPayload; authMethod?: "bearer" | "cookie" };

export class AuthMiddleware {
  public execute = async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;

    // 1. Try to get token from Authorization Header
    let accessToken = this.extractBearerToken(req.headers.authorization);
    const authMethod = accessToken ? "bearer" : "cookie";

    // 2. Fallback to Cookies (for Web applications)
    if (!accessToken && req.cookies) {
      accessToken = req.cookies.accessToken;
    }

    if (!accessToken) {
      return res.status(401).json({ code: 401, status: "error", message: "Authentication required" });
    }

    // 3. Verify token
    const payload = verifyAccessToken(accessToken);
    if (!payload) {
      return res.status(401).json({ code: 401, status: "error", message: "Invalid or expired token" });
    }

    // 4. Attach user to request
    authReq.user = payload;
    authReq.authMethod = authMethod;
    return next();
  };

  // Helper method to extract bearer token from Authorization header
  private extractBearerToken(header?: string) {
    if (!header) return undefined;
    const [scheme, token] = header.split(" ");
    if (!scheme || scheme.toLowerCase() !== "bearer" || !token) return undefined;
    return token.trim();
  }
}
