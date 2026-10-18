import { Router } from "express";
import { AuthMiddleware } from "@/middlewares/auth-middleware";
import { CsrfMiddleware } from "@/middlewares/csrf-middleware";
import { SchemaMiddleware } from "@/middlewares/schema-middleware";
import { RoleValidatorMiddleware } from "@/middlewares/role-validator-middleware";
import { RecipeController } from "@/controllers/recipe-controller";
import {
  createRecipeSchema, recipeIdSchema, updateRecipeSchema, listRecipesSchema, favoriteRecipeSchema, deleteRecipesSchema,
} from "@/schema/recipe-schema";
import { adminListRecipesSchema } from "@/schema/admin-schema";

const router = Router();
const authMiddleware = new AuthMiddleware();
const csrfMiddleware = new CsrfMiddleware();
const schemaMiddleware = new SchemaMiddleware();
const recipeController = new RecipeController();
const roleValidatorMiddleware = new RoleValidatorMiddleware();

// Shortcuts for the middleware chains used below.
const asUser = [authMiddleware.execute, roleValidatorMiddleware.validate("USER")];
const asUserWrite = [authMiddleware.execute, csrfMiddleware.execute, roleValidatorMiddleware.validate("USER")];
const asAdmin = [authMiddleware.execute, roleValidatorMiddleware.validate("ADMIN")];
const asAdminWrite = [authMiddleware.execute, csrfMiddleware.execute, roleValidatorMiddleware.validate("ADMIN")];

// PUBLIC: uploaded recipe photos (used directly in <img> tags, so no login is required).
router.get("/v1/recipe-image/:id", schemaMiddleware.validate(recipeIdSchema), recipeController.getRecipeImage);

// ADMIN: view and moderate every user's recipes.
router.get("/v1/get-all-recipes", ...asAdmin, schemaMiddleware.validate(adminListRecipesSchema), recipeController.getAllRecipes);
router.get("/v1/admin/get-recipe/:id", ...asAdmin, schemaMiddleware.validate(recipeIdSchema), recipeController.adminGetRecipe);
router.post("/v1/admin/update-recipe/:id", ...asAdminWrite, schemaMiddleware.validate(updateRecipeSchema), recipeController.adminUpdateRecipe);
router.post("/v1/admin/delete-recipe/:id", ...asAdminWrite, schemaMiddleware.validate(recipeIdSchema), recipeController.adminDeleteRecipe);

// USER: manage only their own recipes.
router.get("/v1/get-recipes", ...asUser, schemaMiddleware.validate(listRecipesSchema), recipeController.getRecipes);
router.get("/v1/get-recipe/:id", ...asUser, schemaMiddleware.validate(recipeIdSchema), recipeController.getRecipe);
router.post("/v1/create-recipe", ...asUserWrite, schemaMiddleware.validate(createRecipeSchema), recipeController.createRecipe);
router.post("/v1/update-recipe/:id", ...asUserWrite, schemaMiddleware.validate(updateRecipeSchema), recipeController.updateRecipe);
router.post("/v1/delete-recipe/:id", ...asUserWrite, schemaMiddleware.validate(recipeIdSchema), recipeController.deleteRecipe);
router.post("/v1/delete-recipes", ...asUserWrite, schemaMiddleware.validate(deleteRecipesSchema), recipeController.deleteRecipes);
router.post("/v1/favorite-recipe/:id", ...asUserWrite, schemaMiddleware.validate(favoriteRecipeSchema), recipeController.favoriteRecipe);

export default router;
