import { z } from "zod";

const categoryFields = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(40, "Name must be at most 40 characters"),
  // Optional: generated from the name when left empty. Lowercase letters, numbers and dashes only.
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .max(40)
    .regex(/^[a-z0-9-]*$/, "Use lowercase letters, numbers and dashes")
    .optional(),
  description: z.string().trim().max(200, "Description must be at most 200 characters").default(""),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color must be a hex value like #C4532F").default("#C4532F"),
  showOnHome: z.boolean().default(true),
});

const categoryParams = z.object({ id: z.uuid("Invalid category ID") });

export const createCategorySchema = z.object({ body: categoryFields });
export const updateCategorySchema = z.object({
  params: categoryParams,
  body: categoryFields.partial().refine((body) => Object.keys(body).length > 0, "Provide at least one field"),
});
export const categoryIdSchema = z.object({ params: categoryParams });
// The full list of category IDs in their new order (drag-and-drop on the admin Categories page).
export const reorderCategoriesSchema = z.object({
  body: z.object({ ids: z.array(z.uuid()).min(1) }),
});

export type CreateCategoryInput = z.infer<typeof categoryFields>;
export type UpdateCategoryInput = Partial<CreateCategoryInput>;

// "Under 30 Min!" -> "under-30-min"
export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}
