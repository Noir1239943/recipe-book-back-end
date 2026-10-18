import { Router } from "express";
import authRoutes from "@/routes/auth-routes";
import recipeRoutes from "@/routes/recipe-routes";
import categoryRoutes from "@/routes/category-routes";
import adminRoutes from "@/routes/admin-routes";

const router = Router();

// Routes
router.use("/auth", authRoutes);
router.use("/recipes", recipeRoutes);
router.use("/categories", categoryRoutes);
router.use("/admin", adminRoutes);

export default router;
