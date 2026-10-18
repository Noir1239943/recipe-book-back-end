import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { tokens } from "@/db/schema";

type CreateTokenData = {
  userId: string;
  token: string;
  expiresAt: Date;
};

export class TokenRepository {
  // Store the token so the API can track its expiration and usage.
  async createRefreshToken(data: CreateTokenData) {
    const expiresAt = data.expiresAt.toISOString();

    const [token] = await db
      .insert(tokens)
      .values({
        userId: data.userId,
        token: data.token,
        expiresAt: expiresAt,
        type: "REFRESH",
      })
      .returning();

    return token;
  }

  // Only return a token that is unused, unrevoked, and not expired.
  async findActiveRefreshToken(token: string) {
    const currentTime = new Date().toISOString();

    const [activeToken] = await db
      .select()
      .from(tokens)
      .where(
        and(
          eq(tokens.token, token),
          eq(tokens.type, "REFRESH"),
          isNull(tokens.consumedAt),
          isNull(tokens.revokedAt),
          gt(tokens.expiresAt, currentTime),
        ),
      )
      .limit(1);

    return activeToken;
  }

  // Mark the old refresh token as used when the API rotates tokens.
  async consumeToken(id: string) {
    const consumedAt = new Date().toISOString();

    const [token] = await db
      .update(tokens)
      .set({
        consumedAt: consumedAt,
      })
      .where(
        and(
          eq(tokens.id, id),
          isNull(tokens.consumedAt),
          isNull(tokens.revokedAt),
        ),
      )
      .returning();

    // If no row was updated, the service must reject the refresh request.
    return token;
  }

  // Logout revokes the token so it cannot be used to refresh again.
  async revokeToken(id: string) {
    const revokedAt = new Date().toISOString();

    const [token] = await db
      .update(tokens)
      .set({
        revokedAt: revokedAt,
      })
      .where(eq(tokens.id, id))
      .returning();

    return token;
  }
}
