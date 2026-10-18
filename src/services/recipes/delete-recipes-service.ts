import { RecipeRepository } from "@/repositories/recipe-repository";
import { UserRepository } from "@/repositories/user-repository";

// Bulk delete for the "Select all" action on My Recipes.
export async function deleteRecipesService(ids: string[], userId: string) {
  const recipeRepository = new RecipeRepository();
  const userRepository = new UserRepository();

  try {
    // Check if user exists
    const user = await userRepository.findById(userId);
    if (!user) return { code: 401, status: "error", message: "Authentication required" };

    // The repository only deletes rows owned by this user, so other IDs are ignored.
    const deleted = await recipeRepository.deleteMany([...new Set(ids)], user.id);
    const message = deleted.length === 1 ? "1 recipe deleted" : `${deleted.length} recipes deleted`;
    return { code: 200, status: "success", message, data: { deletedIds: deleted.map((recipe) => recipe.id) } };
  } catch (error) {
    console.error("deleteRecipesService Error", error);
    return { code: 500, status: "error", message: "Unable to delete recipes" };
  }
}
