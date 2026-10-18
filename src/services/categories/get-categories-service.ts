import { CategoryRepository } from "@/repositories/category-repository";

// USER: recipe counts are for their own recipes. ADMIN: counts include every user's recipes.
export async function getCategoriesService(userId: string, role: string) {
  const categoryRepository = new CategoryRepository();

  try {
    const categories = await categoryRepository.findAll(role === "ADMIN" ? undefined : userId);
    return { code: 200, status: "success", data: { categories } };
  } catch (error) {
    console.error("getCategoriesService Error", error);
    return { code: 500, status: "error", message: "Unable to get categories" };
  }
}
