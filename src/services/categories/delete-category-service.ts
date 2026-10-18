import { CategoryRepository } from "@/repositories/category-repository";

// Recipes in a deleted category are kept; the database sets their categoryId to NULL.
export async function deleteCategoryService(id: string) {
  const categoryRepository = new CategoryRepository();

  try {
    const category = await categoryRepository.delete(id);
    if (!category) return { code: 404, status: "error", message: "Category not found" };
    return { code: 200, status: "success", message: "Category deleted", data: { category } };
  } catch (error) {
    console.error("deleteCategoryService Error", error);
    return { code: 500, status: "error", message: "Unable to delete category" };
  }
}
