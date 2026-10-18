import { RecipeRepository } from "@/repositories/recipe-repository";
import { UserRepository } from "@/repositories/user-repository";

// `isAdmin` lets an administrator open any user's recipe. Regular users only see their own.
export async function getRecipeService(id: string, userId: string, isAdmin = false) {
  const recipeRepository = new RecipeRepository();
  const userRepository = new UserRepository();

  try {
    // Check if user exists
    const user = await userRepository.findById(userId);
    if (!user) return { code: 401, status: "error", message: "Authentication required" };

    // Check if recipe exists and belongs to the user
    const recipe = await recipeRepository.findById(id, isAdmin ? undefined : user.id);
    if (!recipe) return { code: 404, status: "error", message: "Recipe not found" };
    return { code: 200, status: "success", data: { recipe } };
  } catch (error) {
    console.error("getRecipeService Error", error);
    return { code: 500, status: "error", message: "Unable to get recipe" };
  }
}
