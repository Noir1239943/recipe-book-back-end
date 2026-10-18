// Seeds the starting data. Safe to run many times: it only adds what is missing.
//   npm run db:seed
// 1. The default categories.
// 2. The first admin account, when ADMIN_EMAIL and ADMIN_PASSWORD are set.
// 3. A demo user with sample recipes, when DEMO_USER_EMAIL and DEMO_USER_PASSWORD are set.
import { readFile } from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { db, pool } from "@/db";
import { categories, recipes, users } from "@/db/schema";
import { ENV } from "@/config/env";
import { demoRecipes } from "@/db/demo/demo-recipes";

const defaultCategories = [
  { name: "Breakfast", slug: "breakfast", color: "#E39B2F", description: "Silog plates, pandesal and other morning meals." },
  { name: "Lunch", slug: "lunch", color: "#55683A", description: "Midday meals, soups and rice bowls." },
  { name: "Dinner", slug: "dinner", color: "#C4532F", description: "Mains and hearty plates for the evening meal." },
  { name: "Dessert", slug: "dessert", color: "#8E6BB5", description: "Kakanin, halo-halo and other sweets." },
  { name: "Snacks", slug: "snacks", color: "#C9617A", description: "Merienda and street food." },
];

async function seedCategories() {
  const inserted = await db
    .insert(categories)
    .values(defaultCategories.map((category, index) => ({ ...category, sortOrder: index })))
    .onConflictDoNothing()
    .returning({ name: categories.name });

  console.log(inserted.length ? `✅ Added categories: ${inserted.map((c) => c.name).join(", ")}` : "✅ Categories already exist");
}

async function seedAdmin() {
  if (!ENV.ADMIN_EMAIL || !ENV.ADMIN_PASSWORD) {
    console.log("ℹ️  ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin account");
    return;
  }

  const email = ENV.ADMIN_EMAIL.trim().toLowerCase();
  const [existing] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.email, email)).limit(1);

  if (!existing) {
    await db.insert(users).values({
      name: ENV.ADMIN_NAME,
      email,
      password: await bcrypt.hash(ENV.ADMIN_PASSWORD, 10),
      role: "ADMIN",
    });
    console.log(`✅ Created admin account ${email}`);
  } else if (existing.role !== "ADMIN") {
    // An existing account with this email is promoted. Its password is not changed.
    await db.update(users).set({ role: "ADMIN" }).where(eq(users.id, existing.id));
    console.log(`✅ Promoted ${email} to ADMIN`);
  } else {
    console.log(`✅ Admin account ${email} already exists`);
  }
}

async function seedDemoUser() {
  if (!ENV.DEMO_USER_EMAIL || !ENV.DEMO_USER_PASSWORD) {
    console.log("ℹ️  DEMO_USER_EMAIL / DEMO_USER_PASSWORD not set — skipping demo user");
    return;
  }

  const email = ENV.DEMO_USER_EMAIL.trim().toLowerCase();
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    console.log(`✅ Demo user ${email} already exists (sample recipes not added again)`);
    return;
  }

  const [demoUser] = await db
    .insert(users)
    .values({ name: ENV.DEMO_USER_NAME, email, password: await bcrypt.hash(ENV.DEMO_USER_PASSWORD, 10), role: "USER" })
    .returning({ id: users.id });

  const categoryIds = new Map((await db.select().from(categories)).map((category) => [category.name, category.id]));
  const imageFolder = path.join(process.cwd(), "src/db/demo/images");
  const day = 24 * 60 * 60 * 1000;

  for (const recipe of demoRecipes) {
    const created = new Date(Date.now() - recipe.daysAgo * day).toISOString();
    const photo = await readFile(path.join(imageFolder, recipe.image));
    await db.insert(recipes).values({
      name: recipe.name,
      description: recipe.description,
      categoryId: categoryIds.get(recipe.category) ?? null,
      difficulty: recipe.difficulty,
      cookTimeMinutes: recipe.cookTimeMinutes,
      servings: recipe.servings,
      tags: recipe.tags,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      imageData: photo.toString("base64"),
      imageType: "image/jpeg",
      favoritedAt: recipe.favorite ? new Date(Date.now() - Math.max(0, recipe.daysAgo - 1) * day).toISOString() : null,
      userId: demoUser.id,
      createdAt: created,
      updatedAt: created,
    });
  }
  console.log(`✅ Created demo user ${email} with ${demoRecipes.length} sample recipes`);
}

async function main() {
  await seedCategories();
  await seedAdmin();
  await seedDemoUser();
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
