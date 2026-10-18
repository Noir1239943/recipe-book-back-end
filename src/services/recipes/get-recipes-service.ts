import { RecipeRepository } from "@/repositories/recipe-repository";
import { UserRepository } from "@/repositories/user-repository";
import type { ListRecipesQuery } from "@/schema/recipe-schema";

export async function getRecipesService(userId: string, query: ListRecipesQuery = {}) {
  const recipeRepository = new RecipeRepository();
  const userRepository = new UserRepository();

  try {
    // Check if user exists
    const user = await userRepository.findById(userId);
    if (!user) return { code: 401, status: "error", message: "Authentication required" };

    // Get the user's recipes. Optional filters come from the query string.
    const recipes = await recipeRepository.findAll({
      userId: user.id,
      status: query.status,
      categoryId: query.categoryId,
      search: query.search || undefined,
      favoritesOnly: query.favorites === "true",
    });
    return { code: 200, status: "success", data: { recipes } };
  } catch (error) {
    console.error("getRecipesService Error", error);
    return { code: 500, status: "error", message: "Unable to get recipes" };
  }
}
