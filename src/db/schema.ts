import { pgTable, pgEnum, uuid, text, timestamp, integer, boolean, jsonb, index } from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------
export const role = pgEnum("Role", ["USER", "ADMIN"]);
export const tokenType = pgEnum("TokenType", ["REFRESH", "EMAIL_VERIFY"]);
export const difficulty = pgEnum("Difficulty", ["Easy", "Medium", "Hard"]);
export const recipeStatus = pgEnum("RecipeStatus", ["PUBLISHED", "DRAFT"]);

// One ingredient row from the "Add new recipe" form: 2 | kg | Pork belly
export type Ingredient = { amount: string; unit: string; name: string };

// Shared timestamp columns. `mode: "string"` returns ISO strings instead of Date objects.
const createdAt = () => timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull();
const updatedAt = () => timestamp("updated_at", { withTimezone: true, mode: "string" })
  .defaultNow().notNull().$onUpdate(() => new Date().toISOString());

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------
export const users = pgTable("user", {
  id: uuid().defaultRandom().primaryKey(),
  email: text().unique(),
  password: text(),
  name: text(),
  emailVerified: timestamp("email_verified", { withTimezone: true, mode: "string" }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  role: role().default("USER").notNull(),
});

// Admins manage categories. Users pick one when they save a recipe.
export const categories = pgTable("category", {
  id: uuid().defaultRandom().primaryKey(),
  name: text().notNull().unique(),
  slug: text().notNull().unique(),
  description: text().notNull().default(""),
  color: text().notNull().default("#C4532F"),
  showOnHome: boolean("show_on_home").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const recipes = pgTable("recipe", {
  id: uuid().defaultRandom().primaryKey(),
  name: text().notNull(),
  description: text().notNull().default(""),
  // Deleting a category keeps its recipes; they simply become "Uncategorized".
  categoryId: uuid().references(() => categories.id, { onDelete: "set null" }),
  difficulty: difficulty().notNull().default("Easy"),
  cookTimeMinutes: integer().notNull().default(0),
  servings: integer().notNull().default(1),
  tags: text().array().notNull().default([]),
  ingredients: jsonb().$type<Ingredient[]>().notNull().default([]),
  instructions: text().array().notNull().default([]),
  // A photo is either an external https URL or an uploaded file stored as base64.
  imageUrl: text("image_url"),
  imageData: text("image_data"),
  imageType: text("image_type"),
  status: recipeStatus().notNull().default("PUBLISHED"),
  // NULL = not a favorite. Storing the time lets the admin dashboard chart "new favorites".
  favoritedAt: timestamp("favorited_at", { withTimezone: true, mode: "string" }),
  userId: uuid().notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  index("recipe_owner_idx").on(table.userId),
  index("recipe_category_idx").on(table.categoryId),
]);

export const tokens = pgTable("token", {
  id: uuid().defaultRandom().primaryKey(),
  type: tokenType().notNull(),
  token: text().unique().notNull(),
  expiresAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
  createdAt: createdAt(),
  consumedAt: timestamp("consumed_at", { withTimezone: true, mode: "string" }),
  revokedAt: timestamp("revoked_at", { withTimezone: true, mode: "string" }),
  userId: uuid().notNull().references(() => users.id, { onDelete: "cascade" }),
}, (table) => [index("token_owner_type_idx").on(table.userId, table.type)]);
