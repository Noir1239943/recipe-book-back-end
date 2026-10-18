import { DashboardRepository } from "@/repositories/dashboard-repository";
import { RecipeRepository } from "@/repositories/recipe-repository";

// Everything the admin Dashboard page shows, in one request.
export async function getDashboardService(days: number) {
  const dashboardRepository = new DashboardRepository();
  const recipeRepository = new RecipeRepository();

  try {
    const [totals, categoryBreakdown, activity, recentRecipes] = await Promise.all([
      dashboardRepository.getTotals(),
      dashboardRepository.getRecipesByCategory(),
      dashboardRepository.getActivity(days),
      recipeRepository.findAll({ limit: 5 }),
    ]);

    return {
      code: 200,
      status: "success",
      data: { totals, recipesByCategory: categoryBreakdown.byCategory, uncategorized: categoryBreakdown.uncategorized, activity, recentRecipes },
    };
  } catch (error) {
    console.error("getDashboardService Error", error);
    return { code: 500, status: "error", message: "Unable to load dashboard" };
  }
}
