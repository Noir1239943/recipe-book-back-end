import { TokenRepository } from "@/repositories/token-repository";

export async function logoutService(refreshToken?: string) {
  const tokenRepository = new TokenRepository();

  try {
    // 1. Revoke Refresh Token if provided
    if (refreshToken) {
      const dbToken = await tokenRepository.findActiveRefreshToken(refreshToken);
      if (dbToken) {
        await tokenRepository.revokeToken(dbToken.id);
      }
    }

    // 2. Return success response
    return { code: 200, status: "success", message: "Successfully logged out" };
  } catch (error) {
    console.error("LogoutService Error", error);
    return { code: 500, status: "error", message: "Failed to logout" };
  }
}
