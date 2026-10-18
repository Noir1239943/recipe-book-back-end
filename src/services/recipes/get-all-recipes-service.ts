import { RecipeRepository } from "@/repositories/recipe-repository";

type AdminRecipeQuery = { search?: string; categoryId?: string; status?: "PUBLISHED" | "DRAFT" };

export async function getAllRecipesService(query: AdminRecipeQuery = {}) {
  const recipeRepository = new RecipeRepository();

  try {
    // ADMIN: every user's recipes, including the owner's name.
    const recipes = await recipeRepository.findAll({
      search: query.search || undefined,
      categoryId: query.categoryId,
      status: query.status,
    });
    return { code: 200, status: "success", data: { recipes } };
  } catch (error) {
    console.error("getAllRecipesService Error", error);
    return { code: 500, status: "error", message: "Unable to get all recipes" };
  }
}
