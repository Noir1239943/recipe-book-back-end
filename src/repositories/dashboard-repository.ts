import { and, count, countDistinct, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, recipes, tokens, users } from "@/db/schema";
import { ENV } from "@/config/env";

export class DashboardRepository {
  // Headline numbers for the stat cards.
  async getTotals() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [[recipeTotals], [userTotals], [activeUsers], [categoryTotals]] = await Promise.all([
      db.select({
        total: count(),
        drafts: count(sql`case when ${recipes.status} = 'DRAFT' then 1 end`),
        newThisWeek: count(sql`case when ${recipes.createdAt} > ${sevenDaysAgo} then 1 end`),
        favorites: count(recipes.favoritedAt),
      }).from(recipes),
      db.select({ total: count() }).from(users).where(eq(users.role, "USER")),
      // "Active" = a regular user who signed in during the last 30 days (a refresh token was issued).
      db.select({ total: countDistinct(tokens.userId) })
        .from(tokens)
        .innerJoin(users, eq(tokens.userId, users.id))
        .where(and(eq(tokens.type, "REFRESH"), eq(users.role, "USER"), gt(tokens.createdAt, thirtyDaysAgo))),
      db.select({ total: count() }).from(categories),
    ]);

    return {
      recipes: recipeTotals.total,
      drafts: recipeTotals.drafts,
      newRecipesThisWeek: recipeTotals.newThisWeek,
      favorites: recipeTotals.favorites,
      users: userTotals.total,
      activeUsers: activeUsers.total,
      categories: categoryTotals.total,
    };
  }

  // Number of recipes in each category (all users). Recipes without a category are counted separately.
  async getRecipesByCategory() {
    const byCategory = await db
      .select({
        id: categories.id,
        name: categories.name,
        color: categories.color,
        count: sql<number>`count(${recipes.id})::int`,
      })
      .from(categories)
      .leftJoin(recipes, eq(recipes.categoryId, categories.id))
      .groupBy(categories.id)
      .orderBy(sql`count(${recipes.id}) desc`, categories.sortOrder);

    const [uncategorized] = await db
      .select({ count: count() })
      .from(recipes)
      .where(sql`${recipes.categoryId} is null`);

    return { byCategory, uncategorized: uncategorized.count };
  }

  // One row per day: recipes created and recipes favorited on that day (in APP_TIMEZONE).
  async getActivity(days: number) {
    const tz = ENV.APP_TIMEZONE;
    const result = await db.execute<{ day: string; recipes: number; favorites: number }>(sql`
      select
        to_char(day, 'YYYY-MM-DD') as day,
        (select count(*) from ${recipes}
          where (${recipes.createdAt} at time zone ${tz}) >= day
            and (${recipes.createdAt} at time zone ${tz}) < day + interval '1 day')::int as recipes,
        (select count(*) from ${recipes}
          where (${recipes.favoritedAt} at time zone ${tz}) >= day
            and (${recipes.favoritedAt} at time zone ${tz}) < day + interval '1 day')::int as favorites
      from generate_series(
        date_trunc('day', now() at time zone ${tz}) - ${days - 1} * interval '1 day',
        date_trunc('day', now() at time zone ${tz}),
        interval '1 day'
      ) as day
      order by day
    `);
    return result.rows;
  }
}
