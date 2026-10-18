import { z } from "zod";

// GET /api/admin/v1/get-dashboard?days=30
export const dashboardQuerySchema = z.object({
  query: z.object({
    days: z.enum(["7", "30", "90"]).optional(),
  }),
});

// GET /api/recipes/v1/get-all-recipes?search=adobo&categoryId=...
export const adminListRecipesSchema = z.object({
  query: z.object({
    search: z.string().trim().max(100).optional(),
    categoryId: z.uuid().optional(),
    status: z.enum(["PUBLISHED", "DRAFT"]).optional(),
  }),
});
