import { CategoryRepository } from "@/repositories/category-repository";

// `ids` is every category ID in the new display order (from drag-and-drop).
export async function reorderCategoriesService(ids: string[]) {
  const categoryRepository = new CategoryRepository();

  try {
    const current = await categoryRepository.findAll();
    const sameSet = ids.length === current.length && current.every((category) => ids.includes(category.id));
    if (!sameSet) return { code: 400, status: "error", message: "Send every category ID exactly once" };

    await categoryRepository.reorder(ids);
    return { code: 200, status: "success", message: "Order saved", data: { categories: await categoryRepository.findAll() } };
  } catch (error) {
    console.error("reorderCategoriesService Error", error);
    return { code: 500, status: "error", message: "Unable to reorder categories" };
  }
}
