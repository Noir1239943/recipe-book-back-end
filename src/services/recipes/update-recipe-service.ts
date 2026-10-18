import { RecipeRepository } from "@/repositories/recipe-repository";
import { UserRepository } from "@/repositories/user-repository";
import { CategoryRepository } from "@/repositories/category-repository";
import { findMissingFields, type UpdateRecipeInput } from "@/schema/recipe-schema";
import { toImageColumns } from "@/utils/recipe-image";

// `isAdmin` lets an administrator edit any user's recipe. Regular users can only edit their own.
export async function updateRecipeService(id: string, data: UpdateRecipeInput, userId: string, isAdmin = false) {
  const recipeRepository = new RecipeRepository();
  const userRepository = new UserRepository();
  const categoryRepository = new CategoryRepository();

  try {
    // Check if user exists
    const user = await userRepository.findById(userId);
    if (!user) return { code: 401, status: "error", message: "Authentication required" };

    // Check if recipe exists and belongs to the user
    const ownerId = isAdmin ? undefined : user.id;
    const existing = await recipeRepository.findById(id, ownerId);
    if (!existing) return { code: 404, status: "error", message: "Recipe not found" };

    // The chosen category must exist
    if (data.categoryId && !(await categoryRepository.findById(data.categoryId))) {
      return { code: 400, status: "error", message: "Category not found" };
    }

    // A published recipe must stay complete after the update (drafts can be incomplete).
    const status = data.status ?? existing.status;
    if (status === "PUBLISHED") {
      const missing = findMissingFields({
        categoryId: data.categoryId !== undefined ? data.categoryId : existing.categoryId,
        ingredients: data.ingredients ?? existing.ingredients,
        instructions: data.instructions ?? existing.instructions,
      });
      if (missing.length) {
        return { code: 400, status: "error", message: "Complete the recipe before publishing", errors: missing };
      }
    }

    // Update recipe
    const { image, ...fields } = data;
    const recipe = await recipeRepository.update(id, { ...fields, ...toImageColumns(image) }, ownerId);
    if (!recipe) return { code: 404, status: "error", message: "Recipe not found" };

    return { code: 200, status: "success", message: "Recipe updated", data: { recipe } };
  } catch (error) {
    console.error("updateRecipeService Error", error);
    return { code: 500, status: "error", message: "Unable to update recipe" };
  }
}
