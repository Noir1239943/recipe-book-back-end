import { Router } from "express";
import { SchemaMiddleware } from "@/middlewares/schema-middleware";
import { AuthMiddleware } from "@/middlewares/auth-middleware";
import { CsrfMiddleware } from "@/middlewares/csrf-middleware";
import { AuthController } from "@/controllers/auth-controller";
import { signupSchema, loginSchema, refreshTokenSchema } from "@/schema/auth-schema";

const router = Router();
const schemaMiddleware = new SchemaMiddleware();
const authController = new AuthController();
const authMiddleware = new AuthMiddleware();
const csrfMiddleware = new CsrfMiddleware();

// Authentication Routes
router.get("/v1/csrf-token", authController.getCsrfToken);
router.post("/v1/signup", csrfMiddleware.auth, schemaMiddleware.validate(signupSchema), authController.signup);
router.post("/v1/login", csrfMiddleware.auth, schemaMiddleware.validate(loginSchema), authController.login);
router.post("/v1/refresh-token", csrfMiddleware.refreshToken, schemaMiddleware.validate(refreshTokenSchema), authController.refreshToken);
router.post("/v1/logout", csrfMiddleware.refreshToken, schemaMiddleware.validate(refreshTokenSchema), authController.logout);

// Session Verification
router.get("/v1/session", authMiddleware.execute, authController.userSession);

export default router;
