import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "@/middlewares/auth-middleware";
import {
  getRecipesService, getAllRecipesService, getRecipeService, createRecipeService, updateRecipeService,
  deleteRecipeService, deleteRecipesService, favoriteRecipeService, getRecipeImageService,
} from "@/services/recipes";
import { createRecipeSchema, updateRecipeSchema, listRecipesSchema, favoriteRecipeSchema, deleteRecipesSchema } from "@/schema/recipe-schema";
import { adminListRecipesSchema } from "@/schema/admin-schema";

export class RecipeController {
  // ---------------- ADMIN ----------------
  public getAllRecipes = async (req: Request, res: Response) => {
    const { query } = adminListRecipesSchema.parse({ query: req.query });
    const result = await getAllRecipesService(query);
    return res.status(result.code).json(result);
  };

  public adminGetRecipe = async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user!.sub;
    const result = await getRecipeService(req.params.id as string, userId, true);
    return res.status(result.code).json(result);
  };

  public adminUpdateRecipe = async (req: Request, res: Response) => {
    const { body } = updateRecipeSchema.parse({ body: req.body, params: req.params });
    const userId = (req as AuthenticatedRequest).user!.sub;
    const result = await updateRecipeService(req.params.id as string, body, userId, true);
    return res.status(result.code).json(result);
  };

  public adminDeleteRecipe = async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user!.sub;
    const result = await deleteRecipeService(req.params.id as string, userId, true);
    return res.status(result.code).json(result);
  };

  // ---------------- USER ----------------
  public getRecipes = async (req: Request, res: Response) => {
    const { query } = listRecipesSchema.parse({ query: req.query });
    const userId = (req as AuthenticatedRequest).user!.sub;
    const result = await getRecipesService(userId, query);
    return res.status(result.code).json(result);
  };

  public getRecipe = async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user!.sub;
    const result = await getRecipeService(req.params.id as string, userId);
    return res.status(result.code).json(result);
  };

  public createRecipe = async (req: Request, res: Response) => {
    // Use parsed data to strip unknown fields such as a client-supplied userId.
    const { body } = createRecipeSchema.parse({ body: req.body });
    const userId = (req as AuthenticatedRequest).user!.sub;
    const result = await createRecipeService(body, userId);
    return res.status(result.code).json(result);
  };

  public updateRecipe = async (req: Request, res: Response) => {
    const { body } = updateRecipeSchema.parse({ body: req.body, params: req.params });
    const userId = (req as AuthenticatedRequest).user!.sub;
    const result = await updateRecipeService(req.params.id as string, body, userId);
    return res.status(result.code).json(result);
  };

  public deleteRecipe = async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user!.sub;
    const result = await deleteRecipeService(req.params.id as string, userId);
    return res.status(result.code).json(result);
  };

  public deleteRecipes = async (req: Request, res: Response) => {
    const { body } = deleteRecipesSchema.parse({ body: req.body });
    const userId = (req as AuthenticatedRequest).user!.sub;
    const result = await deleteRecipesService(body.ids, userId);
    return res.status(result.code).json(result);
  };

  public favoriteRecipe = async (req: Request, res: Response) => {
    const { body } = favoriteRecipeSchema.parse({ body: req.body, params: req.params });
    const userId = (req as AuthenticatedRequest).user!.sub;
    const result = await favoriteRecipeService(req.params.id as string, body.favorite, userId);
    return res.status(result.code).json(result);
  };

  // ---------------- PUBLIC ----------------
  // Sends the photo bytes instead of JSON so <img src="..."> works.
  public getRecipeImage = async (req: Request, res: Response) => {
    const result = await getRecipeImageService(req.params.id as string);
    if (result.code !== 200) return res.status(result.code).json(result);

    // Helmet blocks cross-origin use of responses by default; photos must load on the frontend's domain.
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    // The URL contains ?v=<updatedAt>, so the browser may cache it for a long time.
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.type(result.data.contentType);
    return res.send(result.data.buffer);
  };
}
