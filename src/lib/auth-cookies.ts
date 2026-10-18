import type { Response } from "express";
import { ENV } from "@/config/env";
import { toMilliseconds, TokenExpiry } from "@/lib/jwt";
import { csrfCookieOptions, csrfSessionCookieName, csrfTokenCookieName } from "@/lib/csrf";

// In production the frontend (Vercel) and the API (Render) live on different sites, so cookies must be
// `SameSite=None; Secure`. `Partitioned` (CHIPS) keeps them working in browsers that block third-party cookies.
function cookieOptions(maxAge?: number) {
  const isProduction = ENV.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" as const : "lax" as const,
    partitioned: isProduction,
    path: "/",
    maxAge,
  };
}

// remember = false ("Keep me logged in" unchecked) creates session cookies that disappear when the browser closes.
export function setAuthCookies(res: Response, tokens: { accessToken: string; refreshToken: string }, remember = true) {
  res.cookie("accessToken", tokens.accessToken, cookieOptions(toMilliseconds(TokenExpiry.ACCESS_TOKEN_EXPIRES)));
  res.cookie("refreshToken", tokens.refreshToken, cookieOptions(remember ? toMilliseconds(TokenExpiry.REFRESH_TOKEN_EXPIRES) : undefined));
}

export function clearAuthCookies(res: Response) {
  const options = { ...cookieOptions(), expires: new Date(0) };
  res.clearCookie("accessToken", options);
  res.clearCookie("refreshToken", options);
  res.clearCookie(csrfSessionCookieName, csrfCookieOptions);
  res.clearCookie(csrfTokenCookieName, csrfCookieOptions);
}
