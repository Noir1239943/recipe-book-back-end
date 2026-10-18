import { z } from "zod";

export const signupSchema = z.object({
  body: z.object({
    name: z
      .string({ message: "Name is required" })
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(60, "Name must be at most 60 characters"),
    email: z.email({
      message: "Email is required and must be a valid email address",
    }),
    password: z
      .string({ message: "Password is required" })
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.email("Invalid email format"),
    password: z.string().min(1, "Password is required"),
    // "Keep me logged in" checkbox. false = session cookies that end when the browser closes.
    remember: z.boolean().optional(),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().optional(),
  }),
});

export type SignupInput = z.infer<typeof signupSchema>["body"];
export type LoginInput = z.infer<typeof loginSchema>["body"];
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>["body"];