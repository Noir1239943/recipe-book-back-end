import { IMAGE_DATA_URL } from "@/schema/recipe-schema";

type ImageColumns = { imageUrl: string | null; imageData: string | null; imageType: string | null };

// Converts the `image` value sent by the frontend into the three database columns.
//   undefined -> keep the current photo (returns {})
//   null      -> remove the photo
//   https URL -> store the URL
//   data URL  -> store the uploaded file as base64 + its MIME type
export function toImageColumns(image: string | null | undefined): Partial<ImageColumns> {
  if (image === undefined) return {};
  if (image === null) return { imageUrl: null, imageData: null, imageType: null };

  const upload = IMAGE_DATA_URL.exec(image);
  if (upload) return { imageUrl: null, imageType: upload[1], imageData: upload[2] };

  return { imageUrl: image, imageData: null, imageType: null };
}

// What the frontend receives in `recipe.image`: an external URL, or the API path that serves an uploaded photo.
// `?v=` changes whenever the recipe is updated, so browsers do not show an old cached photo.
export function toImageField(recipe: { id: string; imageUrl: string | null; hasUpload: boolean; updatedAt: string }) {
  if (recipe.imageUrl) return recipe.imageUrl;
  if (recipe.hasUpload) return `/api/recipes/v1/recipe-image/${recipe.id}?v=${new Date(recipe.updatedAt).getTime()}`;
  return null;
}
