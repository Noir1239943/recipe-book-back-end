import { RecipeRepository } from "@/repositories/recipe-repository";
import { UserRepository } from "@/repositories/user-repository";

// Adds a recipe to (favorite = true) or removes it from (false) the user's favorites.
export async function favoriteRecipeService(id: string, favorite: boolean, userId: string) {
  const recipeRepository = new RecipeRepository();
  const userRepository = new UserRepository();

  try {
    // Check if user exists
    const user = await userRepository.findById(userId);
    if (!user) return { code: 401, status: "error", message: "Authentication required" };

    const recipe = await recipeRepository.setFavorite(id, user.id, favorite);
    if (!recipe) return { code: 404, status: "error", message: "Recipe not found" };

    return {
      code: 200,
      status: "success",
      message: favorite ? "Added to favorites" : "Removed from favorites",
      data: { recipe: { id: recipe.id, isFavorite: recipe.favoritedAt !== null, favoritedAt: recipe.favoritedAt } },
    };
  } catch (error) {
    console.error("favoriteRecipeService Error", error);
    return { code: 500, status: "error", message: "Unable to update favorites" };
  }
}
