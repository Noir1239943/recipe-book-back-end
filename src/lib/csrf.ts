import { randomBytes } from "node:crypto";
import { doubleCsrf } from "csrf-csrf";
import { ENV } from "@/config/env";

const isProduction = ENV.NODE_ENV === "production";

// Same cross-site settings as the auth cookies (see auth-cookies.ts).
export const csrfCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" as const : "lax" as const,
  partitioned: isProduction,
  path: "/",
};

export const csrfSessionCookieName = isProduction ? "__Host-csrf-session" : "csrf-session";
export const csrfTokenCookieName = isProduction ? "__Host-csrf-token" : "csrf-token";

// Use a stable configured secret in production. The random development secret resets on restart.
const csrfSecret = ENV.CSRF_SECRET || randomBytes(32).toString("hex");
if (isProduction && !ENV.CSRF_SECRET) {
  throw new Error("CSRF_SECRET is required in production");
}

export const { generateCsrfToken, validateRequest } = doubleCsrf({
  getSecret: () => csrfSecret,
  // Refresh-token rotation invalidates the old CSRF token. Before login, use an anonymous ID.
  getSessionIdentifier: (req) => req.cookies?.refreshToken || req.cookies?.accessToken
    || req.cookies?.[csrfSessionCookieName] || "",
  cookieName: csrfTokenCookieName,
  cookieOptions: csrfCookieOptions,
  getCsrfTokenFromRequest: (req) => req.get("x-csrf-token"),
});
