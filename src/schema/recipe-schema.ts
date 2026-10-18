import { z } from "zod";

export const DIFFICULTIES = ["Easy", "Medium", "Hard"] as const;
export const RECIPE_STATUSES = ["PUBLISHED", "DRAFT"] as const;

// Uploaded photos arrive as data URLs, e.g. "data:image/jpeg;base64,/9j/4AAQ...".
// The frontend shrinks photos before upload; 4 MB of base64 is roughly a 3 MB file.
export const IMAGE_DATA_URL = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/;
const MAX_IMAGE_LENGTH = 4_000_000;

const text = z.string().trim().min(1);

const ingredient = z.object({
  amount: z.string().trim().max(20).default(""),
  unit: z.string().trim().max(20).default(""),
  name: text.max(120),
});

// `image` accepts: an http(s) URL, an uploaded data URL, or null to remove the photo.
const image = z
  .string()
  .max(MAX_IMAGE_LENGTH, "Photo is too large. Use a photo under 3 MB.")
  .refine((value) => /^https?:\/\//i.test(value) || IMAGE_DATA_URL.test(value), "Use a JPG, PNG or WebP photo, or an http(s) image URL")
  .nullable();

const recipeFields = z.object({
  name: text.max(120, "Recipe name must be at most 120 characters"),
  description: z.string().trim().max(600, "Description must be at most 600 characters").default(""),
  categoryId: z.uuid("Choose a valid category").nullable().default(null),
  difficulty: z.enum(DIFFICULTIES).default("Easy"),
  cookTimeMinutes: z.number().int().min(0).max(1440, "Time must be 24 hours or less").default(0),
  servings: z.number().int().min(1, "Servings must be at least 1").max(100).default(1),
  tags: z.array(text.max(30)).max(10, "Use up to 10 tags").default([]),
  ingredients: z.array(ingredient).max(60).default([]),
  instructions: z.array(text.max(1000)).max(60).default([]),
  image: image.optional(),
  status: z.enum(RECIPE_STATUSES).default("PUBLISHED"),
});

// A published recipe must be complete. A draft only needs a name.
export function findMissingFields(recipe: { categoryId?: string | null; ingredients?: unknown[]; instructions?: unknown[] }) {
  const missing: { path: string; message: string }[] = [];
  if (!recipe.categoryId) missing.push({ path: "categoryId", message: "Choose a category" });
  if (!recipe.ingredients?.length) missing.push({ path: "ingredients", message: "Add at least one ingredient" });
  if (!recipe.instructions?.length) missing.push({ path: "instructions", message: "Add at least one instruction step" });
  return missing;
}

const createBody = recipeFields.superRefine((recipe, ctx) => {
  if (recipe.status === "DRAFT") return;
  for (const issue of findMissingFields(recipe)) {
    ctx.addIssue({ code: "custom", path: [issue.path], message: issue.message });
  }
});

// Updates may send only the fields that changed. Defaults are removed so missing fields stay untouched.
const updateBody = z.object({
  name: recipeFields.shape.name.optional(),
  description: z.string().trim().max(600).optional(),
  categoryId: z.uuid("Choose a valid category").nullable().optional(),
  difficulty: z.enum(DIFFICULTIES).optional(),
  cookTimeMinutes: z.number().int().min(0).max(1440).optional(),
  servings: z.number().int().min(1).max(100).optional(),
  tags: z.array(text.max(30)).max(10).optional(),
  ingredients: z.array(ingredient).max(60).optional(),
  instructions: z.array(text.max(1000)).max(60).optional(),
  image: image.optional(),
  status: z.enum(RECIPE_STATUSES).optional(),
}).refine((body) => Object.keys(body).length > 0, "Provide at least one recipe field");

const recipeParams = z.object({ id: z.uuid("Invalid recipe ID") });

// GET /get-recipes?status=DRAFT&categoryId=...&search=adobo&favorites=true
const listQuery = z.object({
  status: z.enum(RECIPE_STATUSES).optional(),
  categoryId: z.uuid().optional(),
  search: z.string().trim().max(100).optional(),
  favorites: z.enum(["true", "false"]).optional(),
});

export const createRecipeSchema = z.object({ body: createBody });
export const recipeIdSchema = z.object({ params: recipeParams });
export const updateRecipeSchema = z.object({ params: recipeParams, body: updateBody });
export const listRecipesSchema = z.object({ query: listQuery });
export const favoriteRecipeSchema = z.object({ params: recipeParams, body: z.object({ favorite: z.boolean() }) });
export const deleteRecipesSchema = z.object({
  body: z.object({ ids: z.array(z.uuid("Invalid recipe ID")).min(1, "Select at least one recipe").max(100) }),
});

export type CreateRecipeInput = z.infer<typeof createBody>;
export type UpdateRecipeInput = z.infer<typeof updateBody>;
export type ListRecipesQuery = z.infer<typeof listQuery>;
