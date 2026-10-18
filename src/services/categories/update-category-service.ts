import { CategoryRepository } from "@/repositories/category-repository";
import { slugify, type UpdateCategoryInput } from "@/schema/category-schema";

export async function updateCategoryService(id: string, data: UpdateCategoryInput) {
  const categoryRepository = new CategoryRepository();

  try {
    const existing = await categoryRepository.findById(id);
    if (!existing) return { code: 404, status: "error", message: "Category not found" };

    // An empty slug means "generate it from the name again".
    const name = data.name ?? existing.name;
    const slug = data.slug === undefined ? existing.slug : data.slug || slugify(name);

    // Names and slugs must stay unique (ignoring this category itself)
    const duplicate = await categoryRepository.findByNameOrSlug(name, slug);
    if (duplicate && duplicate.id !== id) {
      return { code: 409, status: "error", message: "A category with this name or slug already exists" };
    }

    const category = await categoryRepository.update(id, { ...data, slug });
    return { code: 200, status: "success", message: "Category updated", data: { category } };
  } catch (error) {
    console.error("updateCategoryService Error", error);
    return { code: 500, status: "error", message: "Unable to update category" };
  }
}
