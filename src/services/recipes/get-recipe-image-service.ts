import { RecipeRepository } from "@/repositories/recipe-repository";

// Returns an uploaded photo as binary data so it can be used in an <img src="...">.
export async function getRecipeImageService(id: string) {
  const recipeRepository = new RecipeRepository();

  try {
    const image = await recipeRepository.findImage(id);
    if (!image?.imageData || !image.imageType) {
      return { code: 404, status: "error", message: "Photo not found" } as const;
    }

    return {
      code: 200,
      status: "success",
      data: { buffer: Buffer.from(image.imageData, "base64"), contentType: image.imageType },
    } as const;
  } catch (error) {
    console.error("getRecipeImageService Error", error);
    return { code: 500, status: "error", message: "Unable to load photo" } as const;
  }
}
