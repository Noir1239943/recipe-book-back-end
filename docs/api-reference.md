# API reference

Base URL: `http://localhost:7000/api` locally, `https://<your-service>.onrender.com/api` on Render.

- **Browser clients** send cookies (`credentials: "include"`) and, on every POST, the `x-csrf-token` header. See [auth-and-csrf.md](auth-and-csrf.md).
- **Postman / mobile** can log in without cookies and use `Authorization: Bearer <accessToken>` instead; Bearer requests skip CSRF.

## Health

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/health` | – | `{ "status": "success", "message": "API is healthy" }` |

## Auth — `/auth`

| Method | Path | Auth | Body | Description |
| --- | --- | --- | --- | --- |
| GET | `/v1/csrf-token` | – | – | Returns `data.csrfToken` and sets the CSRF cookies |
| POST | `/v1/signup` | CSRF | `{ name, email, password }` | Creates a USER. Password: 8+ chars, 1 uppercase, 1 number. 409 if the email exists |
| POST | `/v1/login` | CSRF | `{ email, password, remember? }` | Sets `accessToken` (15 min) and `refreshToken` (7 days, or session-only when `remember` is false) cookies |
| POST | `/v1/refresh-token` | CSRF | `{}` or `{ refreshToken }` | Rotates both tokens. Fetch a new CSRF token afterwards |
| POST | `/v1/logout` | CSRF | `{}` | Revokes the refresh token and clears cookies |
| GET | `/v1/session` | login | – | `data.user`: `{ id, name, email, role }` |

## Recipes — `/recipes`

### USER (own recipes only)

| Method | Path | Body / query | Description |
| --- | --- | --- | --- |
| GET | `/v1/get-recipes` | `?status=PUBLISHED\|DRAFT&categoryId=&search=&favorites=true` | List, newest update first |
| GET | `/v1/get-recipe/:id` | – | One recipe |
| POST | `/v1/create-recipe` | Recipe body (below) | 201 + `data.recipe` |
| POST | `/v1/update-recipe/:id` | Any recipe fields | Only sent fields change |
| POST | `/v1/delete-recipe/:id` | – | Delete one |
| POST | `/v1/delete-recipes` | `{ ids: [uuid, …] }` | Bulk delete ("Select all"). IDs that are not yours are ignored |
| POST | `/v1/favorite-recipe/:id` | `{ favorite: true \| false }` | Add/remove favorite |

### ADMIN (every user's recipes)

| Method | Path | Description |
| --- | --- | --- |
| GET | `/v1/get-all-recipes?search=&categoryId=&status=` | All recipes, each with `ownerName` |
| GET | `/v1/admin/get-recipe/:id` | Any recipe |
| POST | `/v1/admin/update-recipe/:id` | Edit any recipe |
| POST | `/v1/admin/delete-recipe/:id` | Delete any recipe |

### Public

| Method | Path | Description |
| --- | --- | --- |
| GET | `/v1/recipe-image/:id` | Uploaded photo bytes (`image/jpeg`, `image/png` or `image/webp`) |

### Recipe body

```json
{
  "name": "Chicken Adobo",
  "description": "Chicken braised in vinegar and soy sauce.",
  "categoryId": "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed",
  "difficulty": "Easy",
  "cookTimeMinutes": 45,
  "servings": 4,
  "tags": ["Classic"],
  "ingredients": [{ "amount": "1", "unit": "kg", "name": "Chicken thighs" }],
  "instructions": ["Marinate the chicken.", "Simmer for 30 minutes."],
  "image": "data:image/jpeg;base64,/9j/4AAQ…",
  "status": "PUBLISHED"
}
```

- `image`: a `data:` URL (upload), an `https://` link, or `null` to remove the photo. Leave it out to keep the current photo.
- `status: "DRAFT"` only needs `name`. `PUBLISHED` also needs `categoryId`, one ingredient and one instruction.

### Recipe response

```json
{
  "id": "…", "name": "Chicken Adobo", "description": "…",
  "categoryId": "…", "category": { "id": "…", "name": "Dinner", "color": "#C4532F" },
  "difficulty": "Easy", "cookTimeMinutes": 45, "servings": 4, "tags": ["Classic"],
  "ingredients": [{ "amount": "1", "unit": "kg", "name": "Chicken thighs" }],
  "instructions": ["…"],
  "image": "/api/recipes/v1/recipe-image/<id>?v=1792300000000",
  "status": "PUBLISHED", "isFavorite": true, "favoritedAt": "2026-10-18T06:00:00.000Z",
  "userId": "…", "ownerName": "Juan Dela Cruz", "createdAt": "…", "updatedAt": "…"
}
```

## Categories — `/categories`

| Method | Path | Auth | Body | Description |
| --- | --- | --- | --- | --- |
| GET | `/v1/get-categories` | USER or ADMIN | – | In display order, with `recipeCount` (your own recipes for USER, all recipes for ADMIN) |
| POST | `/v1/create-category` | ADMIN | `{ name, slug?, description?, color?, showOnHome? }` | Slug is generated from the name when empty. 409 for duplicates |
| POST | `/v1/update-category/:id` | ADMIN | any of the fields above | |
| POST | `/v1/delete-category/:id` | ADMIN | – | Its recipes become uncategorized |
| POST | `/v1/reorder-categories` | ADMIN | `{ ids: [every category id in the new order] }` | Saved in one transaction |

## Admin — `/admin`

| Method | Path | Description |
| --- | --- | --- |
| GET | `/v1/get-dashboard?days=7\|30\|90` | Totals, activity per day, recipes by category, recent recipes |

## Status codes

| Code | Meaning |
| --- | --- |
| 200 / 201 | Success / created |
| 400 | Validation failed (`errors` lists each field) or a business rule failed |
| 401 | Not logged in, or the access token expired (the frontend then calls `/refresh-token`) |
| 403 | Wrong role, or missing/invalid CSRF token |
| 404 | Not found, or not yours |
| 409 | Duplicate email or category |
| 413 | Request too large (photo over the limit) |
