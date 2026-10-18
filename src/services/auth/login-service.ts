import bcrypt from "bcrypt";
import { UserRepository } from "@/repositories/user-repository";
import { TokenRepository } from "@/repositories/token-repository";
import { signAccessToken, signRefreshToken, TokenExpiry } from "@/lib/jwt";

export async function loginService(email: string, password: string, remember = true) {
  const userRepository = new UserRepository();
  const tokenRepository = new TokenRepository();

  try {
    // Validate User Credentials
    const user = await userRepository.findByEmail(email.trim().toLowerCase());
    if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
      return { code: 400, status: "error", message: "Incorrect email or password" };
    }

    // Generate Access & RefreshTokens
    const accessToken = signAccessToken(user.id, user.role, TokenExpiry.ACCESS_TOKEN_EXPIRES);
    const refreshToken = signRefreshToken(user.id, user.role, TokenExpiry.REFRESH_TOKEN_EXPIRES, remember);

    // Save Refresh Token to DB for tracking/rotation
    await tokenRepository.createRefreshToken({
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    // Return success response
    return {
      code: 200,
      status: "success",
      message: "Successfully logged in",
      data: { accessToken, refreshToken, remember }
    };

  } catch (error) {
    console.error("LoginCredentialService Error", error);
    return { code: 500, status: "error", message: "Failed to login account" };
  }
}