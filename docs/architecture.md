# Architecture

## Layers

The API keeps the tutorial's four layers. Each layer only talks to the one below it.

| Layer | Folder | Job | Example |
| --- | --- | --- | --- |
| Route | `src/routes` | Maps a URL + method to middleware and a controller method | `router.post("/v1/create-recipe", ...asUserWrite, schemaMiddleware.validate(createRecipeSchema), recipeController.createRecipe)` |
| Controller | `src/controllers` | Reads the request, calls one service, sends the result | `createRecipe` parses the body with Zod (which strips unknown fields like `userId`) and calls `createRecipeService(body, userId)` |
| Service | `src/services` | Business rules, wrapped in try/catch, returns `{ code, status, message, data }` | `createRecipeService` checks the user exists and the category exists, then saves |
| Repository | `src/repositories` | Database queries with Drizzle | `RecipeRepository.create()` inserts the row and returns it with its category |

Why: controllers stay tiny, rules are testable without Express, and every SQL query is in one place.

## Middleware order on protected routes

```
AuthMiddleware        reads the accessToken cookie (or "Authorization: Bearer …"), verifies the JWT, sets req.user
CsrfMiddleware        POST only: the x-csrf-token header must match the CSRF cookie (skipped for Bearer clients)
RoleValidator         req.user.role must be USER or ADMIN, depending on the route
SchemaMiddleware      Zod validation of params, query and body → 400 with a list of errors
Controller
```

In `recipe-routes.ts` these chains are named `asUser`, `asUserWrite`, `asAdmin` and `asAdminWrite`.

## Database

```
user ──< token            refresh tokens (rotation + logout)
user ──< recipe >── category
```

| Table | Important columns |
| --- | --- |
| `user` | `email` (unique, lowercase), `password` (bcrypt hash), `role` (`USER` / `ADMIN`) |
| `token` | `token`, `type`, `expiresAt`, `consumedAt`, `revokedAt` |
| `category` | `name` and `slug` (unique), `color`, `showOnHome`, `sortOrder` |
| `recipe` | `name`, `description`, `categoryId`, `difficulty`, `cookTimeMinutes`, `servings`, `tags[]`, `ingredients` (JSON array of `{ amount, unit, name }`), `instructions[]`, `imageUrl` / `imageData` / `imageType`, `status` (`PUBLISHED` / `DRAFT`), `favoritedAt`, `userId` |

Foreign keys:
- Deleting a **user** deletes their recipes and tokens (`on delete cascade`).
- Deleting a **category** keeps its recipes and sets `categoryId` to `NULL` (`on delete set null`). The UI shows them as "Uncategorized".

To change the schema: edit `src/db/schema.ts` → `npm run db:plan` → review the new SQL in `drizzle/` → `npm run db:migrate`.

## Ownership and roles

- Every USER query includes `where userId = <logged-in user>` in the repository, so one user can never read, edit or delete another user's recipe. A wrong ID simply returns 404.
- USER routes reject admins (`validate("USER")`), and ADMIN routes reject users. Admin recipe routes call the same services with `isAdmin = true`, which removes the owner filter.
- Public signup always creates a `USER`. The first admin is created by `npm run db:seed` from `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

## Recipe rules

- **Draft** (`status: "DRAFT"`): only the name is required.
- **Published**: must have a category, at least one ingredient and at least one step. This is checked on create (Zod `superRefine`) and on update (the service merges the update with the saved recipe and checks the result).
- Favoriting does not change `updatedAt`, because it is not an edit.

## Photos

1. The frontend resizes the photo to at most 1600 px and converts it to a JPEG data URL (`data:image/jpeg;base64,…`).
2. The API stores the base64 data in `imageData` and the type in `imageType` (`utils/recipe-image.ts`). An `https://` link is stored in `imageUrl` instead.
3. Recipe responses never include the large base64 text. They include `image: "/api/recipes/v1/recipe-image/<id>?v=<updatedAt>"`.
4. `GET /recipe-image/:id` sends the bytes with `Cross-Origin-Resource-Policy: cross-origin` (so Vercel pages may show them) and a long cache. The `?v=` part changes when the recipe changes, so browsers never show an old photo.

Render's disk is wiped on every deploy, which is why photos live in the database rather than in a folder.

## Admin dashboard

`GET /api/admin/v1/get-dashboard?days=7|30|90` returns everything the page needs in one request:

- `totals`: recipes, drafts, recipes added this week, favorites, users, active users (signed in during the last 30 days, based on refresh tokens), categories
- `recipesByCategory` and `uncategorized`
- `activity`: one row per day with new recipes and new favorites, built with PostgreSQL `generate_series` in `APP_TIMEZONE`
- `recentRecipes`: the 5 most recently updated recipes from all users
