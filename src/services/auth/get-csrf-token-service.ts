import { randomBytes } from "node:crypto";
import type { Request, Response } from "express";
import { csrfCookieOptions, csrfSessionCookieName, generateCsrfToken } from "@/lib/csrf";

export function getCsrfTokenService(req: Request, res: Response) {
  if (!req.cookies[csrfSessionCookieName]) {
    const sessionId = randomBytes(32).toString("hex");
    req.cookies[csrfSessionCookieName] = sessionId;
    res.cookie(csrfSessionCookieName, sessionId, csrfCookieOptions);
  }
  const csrfToken = generateCsrfToken(req, res);
  res.setHeader("Cache-Control", "no-store");
  return { code: 200, status: "success", data: { csrfToken } };
}
