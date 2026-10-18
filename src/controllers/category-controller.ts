import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "@/middlewares/auth-middleware";
import {
  getCategoriesService, createCategoryService, updateCategoryService, deleteCategoryService, reorderCategoriesService,
} from "@/services/categories";
import { createCategorySchema, updateCategorySchema, reorderCategoriesSchema } from "@/schema/category-schema";

export class CategoryController {
  public getCategories = async (req: Request, res: Response) => {
    const { sub, role } = (req as AuthenticatedRequest).user!;
    const result = await getCategoriesService(sub, role);
    return res.status(result.code).json(result);
  };

  public createCategory = async (req: Request, res: Response) => {
    const { body } = createCategorySchema.parse({ body: req.body });
    const result = await createCategoryService(body);
    return res.status(result.code).json(result);
  };

  public updateCategory = async (req: Request, res: Response) => {
    const { body } = updateCategorySchema.parse({ body: req.body, params: req.params });
    const result = await updateCategoryService(req.params.id as string, body);
    return res.status(result.code).json(result);
  };

  public deleteCategory = async (req: Request, res: Response) => {
    const result = await deleteCategoryService(req.params.id as string);
    return res.status(result.code).json(result);
  };

  public reorderCategories = async (req: Request, res: Response) => {
    const { body } = reorderCategoriesSchema.parse({ body: req.body });
    const result = await reorderCategoriesService(body.ids);
    return res.status(result.code).json(result);
  };
}
