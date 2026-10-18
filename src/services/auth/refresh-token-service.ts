import { UserRepository } from "@/repositories/user-repository";
import { TokenRepository } from "@/repositories/token-repository";
import { signAccessToken, signRefreshToken, TokenExpiry, verifyRefreshToken } from "@/lib/jwt";

export async function refreshTokenService(refreshToken?: string) {
  const tokenRepository = new TokenRepository();
  const userRepository = new UserRepository();

  try {
    // 1. Verify JWT signature and type
    const payload = verifyRefreshToken(refreshToken!);
    if (!payload) {
      return { code: 401, status: "error", message: "Invalid or expired refresh token" };
    }

    // 2. Check Database for the token (to verify it's not consumed/revoked)
    const dbToken = await tokenRepository.findActiveRefreshToken(refreshToken!);
    if (!dbToken) {
      return { code: 401, status: "error", message: "Token is no longer valid or has been used" };
    }

    // 3. Verify user still exists
    const user = await userRepository.findById(payload.sub);
    if (!user) {
      return { code: 404, status: "error", message: "User not found" };
    }

    // 4. Token Rotation: Consume the old token and generate a new pair
    const consumed = await tokenRepository.consumeToken(dbToken.id);
    if (!consumed) return { code: 401, status: "error", message: "Refresh token has already been used" };

    const accessToken = signAccessToken(user.id, user.role, TokenExpiry.ACCESS_TOKEN_EXPIRES);
    // Keep the "Keep me logged in" choice from the original login.
    const remember = payload.remember !== false;
    const newRefreshToken = signRefreshToken(user.id, user.role, TokenExpiry.REFRESH_TOKEN_EXPIRES, remember);

    // 5. Store the new refresh token
    await tokenRepository.createRefreshToken({
      userId: user.id,
      token: newRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    // Return success response
    return {
      code: 200,
      status: "success",
      message: "Successfully refreshed token",
      data: { accessToken, refreshToken: newRefreshToken, remember }
    };

  } catch (error) {
    console.error("RefreshTokenService Error", error);
    return { code: 500, status: "error", message: "Failed to refresh token" };
  }
}
