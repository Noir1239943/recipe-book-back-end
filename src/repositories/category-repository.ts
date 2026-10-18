import { and, asc, eq, getTableColumns, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, recipes } from "@/db/schema";

type CategoryInsert = typeof categories.$inferInsert;

export class CategoryRepository {
  // Categories in display order, each with how many recipes use it.
  // Pass `userId` to count only that user's recipes; omit it (admins) to count every recipe.
  async findAll(userId?: string) {
    return db
      .select({
        ...getTableColumns(categories),
        recipeCount: sql<number>`count(${recipes.id})::int`,
      })
      .from(categories)
      .leftJoin(recipes, and(
        eq(recipes.categoryId, categories.id),
        userId ? eq(recipes.userId, userId) : undefined,
      ))
      .groupBy(categories.id)
      .orderBy(asc(categories.sortOrder), asc(categories.name));
  }

  async findById(id: string) {
    const [category] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    return category;
  }

  async findByNameOrSlug(name: string, slug: string) {
    const [category] = await db
      .select()
      .from(categories)
      .where(sql`lower(${categories.name}) = lower(${name}) or ${categories.slug} = ${slug}`)
      .limit(1);
    return category;
  }

  // New categories go to the end of the list.
  async nextSortOrder() {
    const [result] = await db
      .select({ max: sql<number>`coalesce(max(${categories.sortOrder}), -1)::int` })
      .from(categories);
    return result.max + 1;
  }

  async create(data: CategoryInsert) {
    const [category] = await db.insert(categories).values(data).returning();
    return category;
  }

  async update(id: string, data: Partial<CategoryInsert>) {
    const [category] = await db.update(categories).set(data).where(eq(categories.id, id)).returning();
    return category;
  }

  async delete(id: string) {
    const [category] = await db.delete(categories).where(eq(categories.id, id)).returning();
    return category;
  }

  // Save a new order in one transaction: either every row is updated or none is.
  async reorder(ids: string[]) {
    await db.transaction(async (tx) => {
      for (const [index, id] of ids.entries()) {
        await tx.update(categories).set({ sortOrder: index }).where(eq(categories.id, id));
      }
    });
  }
}
