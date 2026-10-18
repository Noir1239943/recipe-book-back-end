import { Router } from "express";
import { AuthMiddleware } from "@/middlewares/auth-middleware";
import { CsrfMiddleware } from "@/middlewares/csrf-middleware";
import { SchemaMiddleware } from "@/middlewares/schema-middleware";
import { RoleValidatorMiddleware } from "@/middlewares/role-validator-middleware";
import { CategoryController } from "@/controllers/category-controller";
import { createCategorySchema, updateCategorySchema, categoryIdSchema, reorderCategoriesSchema } from "@/schema/category-schema";

const router = Router();
const authMiddleware = new AuthMiddleware();
const csrfMiddleware = new CsrfMiddleware();
const schemaMiddleware = new SchemaMiddleware();
const categoryController = new CategoryController();
const roleValidatorMiddleware = new RoleValidatorMiddleware();

const asAdminWrite = [authMiddleware.execute, csrfMiddleware.execute, roleValidatorMiddleware.validate("ADMIN")];

// USER + ADMIN: read categories (filter chips, the recipe form's dropdown, the admin Categories page).
router.get("/v1/get-categories", authMiddleware.execute, roleValidatorMiddleware.validate("USER", "ADMIN"), categoryController.getCategories);

// ADMIN: manage categories.
router.post("/v1/create-category", ...asAdminWrite, schemaMiddleware.validate(createCategorySchema), categoryController.createCategory);
router.post("/v1/update-category/:id", ...asAdminWrite, schemaMiddleware.validate(updateCategorySchema), categoryController.updateCategory);
router.post("/v1/delete-category/:id", ...asAdminWrite, schemaMiddleware.validate(categoryIdSchema), categoryController.deleteCategory);
router.post("/v1/reorder-categories", ...asAdminWrite, schemaMiddleware.validate(reorderCategoriesSchema), categoryController.reorderCategories);

export default router;
