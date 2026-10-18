import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import type { SignupInput } from "@/schema/auth-schema";

// Return account details without exposing the stored password hash.
const publicFields = {
  id: users.id,
  name: users.name,
  email: users.email,
  createdAt: users.createdAt,
  role: users.role,
  emailVerified: users.emailVerified,
};

export class UserRepository {
  async findById(id: string) {
    const [user] = await db
      .select(publicFields)
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return user;
  }

  async findByEmail(email: string) {
    // Login needs the password hash to check the supplied password.
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user;
  }

  async create(data: SignupInput) {
    const [user] = await db
      .insert(users)
      .values(data)
      .returning(publicFields);

    return user;
  }

  async markEmailVerified(userId: string) {
    const [user] = await db
      .update(users)
      .set({ emailVerified: new Date().toISOString() })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        email: users.email,
        emailVerified: users.emailVerified,
      });

    return user;
  }
}
