import { CategoryRepository } from "@/repositories/category-repository";
import { slugify, type CreateCategoryInput } from "@/schema/category-schema";

export async function createCategoryService(data: CreateCategoryInput) {
  const categoryRepository = new CategoryRepository();

  try {
    // Build the URL slug from the name when the admin leaves it empty.
    const slug = data.slug || slugify(data.name);
    if (!slug) return { code: 400, status: "error", message: "Use letters or numbers in the name" };

    // Names and slugs must be unique
    if (await categoryRepository.findByNameOrSlug(data.name, slug)) {
      return { code: 409, status: "error", message: "A category with this name or slug already exists" };
    }

    const sortOrder = await categoryRepository.nextSortOrder();
    const category = await categoryRepository.create({ ...data, slug, sortOrder });
    return { code: 201, status: "success", message: "Category created", data: { category } };
  } catch (error) {
    console.error("createCategoryService Error", error);
    return { code: 500, status: "error", message: "Unable to create category" };
  }
}
