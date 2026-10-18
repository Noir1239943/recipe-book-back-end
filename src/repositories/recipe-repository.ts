import { and, desc, eq, ilike, inArray, isNotNull, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { categories, recipes, users } from "@/db/schema";
import { toImageField } from "@/utils/recipe-image";

export type RecipeFilters = {
  userId?: string;          // only this owner's recipes (USER routes). Omit for admins.
  status?: "PUBLISHED" | "DRAFT";
  categoryId?: string;
  search?: string;
  favoritesOnly?: boolean;
  limit?: number;
};

// Columns returned to the frontend. The large `imageData` column is left out on purpose;
// uploaded photos are served separately by GET /recipe-image/:id.
const recipeColumns = {
  id: recipes.id,
  name: recipes.name,
  description: recipes.description,
  categoryId: recipes.categoryId,
  difficulty: recipes.difficulty,
  cookTimeMinutes: recipes.cookTimeMinutes,
  servings: recipes.servings,
  tags: recipes.tags,
  ingredients: recipes.ingredients,
  instructions: recipes.instructions,
  imageUrl: recipes.imageUrl,
  hasUpload: sql<boolean>`${recipes.imageData} is not null`,
  status: recipes.status,
  favoritedAt: recipes.favoritedAt,
  userId: recipes.userId,
  createdAt: recipes.createdAt,
  updatedAt: recipes.updatedAt,
  categoryName: categories.name,
  categoryColor: categories.color,
  ownerName: users.name,
};

// Recipe + its category + the owner's name in one query.
const selectRecipes = () => db
  .select(recipeColumns)
  .from(recipes)
  .leftJoin(categories, eq(recipes.categoryId, categories.id))
  .innerJoin(users, eq(recipes.userId, users.id));

type RecipeRow = Awaited<ReturnType<typeof selectRecipes>>[number];

// Shapes one database row into the JSON the frontend uses.
function toRecipe(row: RecipeRow) {
  const { imageUrl, hasUpload, categoryName, categoryColor, ...recipe } = row;
  return {
    ...recipe,
    image: toImageField({ id: row.id, imageUrl, hasUpload, updatedAt: row.updatedAt }),
    category: row.categoryId && categoryName ? { id: row.categoryId, name: categoryName, color: categoryColor } : null,
    isFavorite: row.favoritedAt !== null,
  };
}

// Escape % and _ so a search for "50%" is not treated as a wildcard.
function searchPattern(search: string) {
  return `%${search.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

export class RecipeRepository {
  async findAll(filters: RecipeFilters = {}) {
    const conditions: (SQL | undefined)[] = [
      filters.userId ? eq(recipes.userId, filters.userId) : undefined,
      filters.status ? eq(recipes.status, filters.status) : undefined,
      filters.categoryId ? eq(recipes.categoryId, filters.categoryId) : undefined,
      filters.favoritesOnly ? isNotNull(recipes.favoritedAt) : undefined,
    ];

    // Search the name, description, tags and ingredient names.
    if (filters.search) {
      const pattern = searchPattern(filters.search);
      conditions.push(or(
        ilike(recipes.name, pattern),
        ilike(recipes.description, pattern),
        sql`array_to_string(${recipes.tags}, ' ') ilike ${pattern}`,
        sql`${recipes.ingredients}::text ilike ${pattern}`,
      ));
    }

    const rows = await selectRecipes()
      .where(and(...conditions))
      .orderBy(desc(recipes.updatedAt))
      .limit(filters.limit ?? 500);

    return rows.map(toRecipe);
  }

  async findById(id: string, userId?: string) {
    const [row] = await selectRecipes()
      .where(and(eq(recipes.id, id), userId ? eq(recipes.userId, userId) : undefined))
      .limit(1);

    return row ? toRecipe(row) : undefined;
  }

  // Only the photo columns, for GET /recipe-image/:id.
  async findImage(id: string) {
    const [image] = await db
      .select({ imageData: recipes.imageData, imageType: recipes.imageType, imageUrl: recipes.imageUrl })
      .from(recipes)
      .where(eq(recipes.id, id))
      .limit(1);

    return image;
  }

  async create(data: typeof recipes.$inferInsert) {
    const [created] = await db.insert(recipes).values(data).returning({ id: recipes.id });
    return this.findById(created.id);
  }

  async update(id: string, data: Partial<typeof recipes.$inferInsert>, userId?: string) {
    const [updated] = await db
      .update(recipes)
      .set(data)
      .where(and(eq(recipes.id, id), userId ? eq(recipes.userId, userId) : undefined))
      .returning({ id: recipes.id });

    return updated ? this.findById(updated.id) : undefined;
  }

  async delete(id: string, userId?: string) {
    const [recipe] = await db
      .delete(recipes)
      .where(and(eq(recipes.id, id), userId ? eq(recipes.userId, userId) : undefined))
      .returning({ id: recipes.id, name: recipes.name });

    return recipe;
  }

  // Bulk delete for "Select all". The owner filter makes sure users can only delete their own recipes.
  async deleteMany(ids: string[], userId: string) {
    return db
      .delete(recipes)
      .where(and(inArray(recipes.id, ids), eq(recipes.userId, userId)))
      .returning({ id: recipes.id });
  }

  // Favorites are stored as a timestamp on the recipe (NULL = not a favorite).
  // `updatedAt` is left unchanged because favoriting is not an edit.
  async setFavorite(id: string, userId: string, favorite: boolean) {
    const [recipe] = await db
      .update(recipes)
      .set({ favoritedAt: favorite ? new Date().toISOString() : null, updatedAt: sql`${recipes.updatedAt}` })
      .where(and(eq(recipes.id, id), eq(recipes.userId, userId)))
      .returning({ id: recipes.id, favoritedAt: recipes.favoritedAt });

    return recipe;
  }
}
