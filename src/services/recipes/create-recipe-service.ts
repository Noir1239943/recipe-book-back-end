import { RecipeRepository } from "@/repositories/recipe-repository";
import { UserRepository } from "@/repositories/user-repository";
import { CategoryRepository } from "@/repositories/category-repository";
import type { CreateRecipeInput } from "@/schema/recipe-schema";
import { toImageColumns } from "@/utils/recipe-image";

export async function createRecipeService(data: CreateRecipeInput, userId: string) {
  const recipeRepository = new RecipeRepository();
  const userRepository = new UserRepository();
  const categoryRepository = new CategoryRepository();

  try {
    // Check if user exists
    const user = await userRepository.findById(userId);
    if (!user) return { code: 401, status: "error", message: "Authentication required" };

    // The chosen category must exist
    if (data.categoryId && !(await categoryRepository.findById(data.categoryId))) {
      return { code: 400, status: "error", message: "Category not found" };
    }

    // Create recipe. `image` is split into the photo columns (URL or uploaded file).
    const { image, ...fields } = data;
    const recipe = await recipeRepository.create({ ...fields, ...toImageColumns(image), userId: user.id });
    return { code: 201, status: "success", message: fields.status === "DRAFT" ? "Draft saved" : "Recipe saved", data: { recipe } };
  } catch (error) {
    console.error("createRecipeService Error", error);
    return { code: 500, status: "error", message: "Unable to create recipe" };
  }
}
