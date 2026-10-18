# Recipe Book API

REST API for the Recipe Book app, built with **Express.js 5**, **TypeScript**, **Drizzle ORM** and **PostgreSQL (Neon)**.
The frontend lives in a separate repository: [`recipe-book-web`](https://github.com/Noir1239943/recipe-book-web).

It follows the structure of the AppsDev API tutorial (routes → controllers → services → repositories) and adds
what our Figma design needs: categories, favorites, drafts, photo uploads and an admin dashboard.

| | |
| --- | --- |
| Runtime | Node.js 22 or 24 |
| Framework | Express 5 + TypeScript |
| Database | PostgreSQL on [Neon](https://neon.com), queried with Drizzle ORM |
| Auth | JWT access + refresh tokens in HttpOnly cookies, CSRF double-submit tokens |
| Validation | Zod |
| Hosting | [Render](https://render.com) Web Service |

## Run it locally (VS Code)

1. Open the folder in VS Code, then open the terminal (`` Ctrl+` ``).
2. Install packages:
   ```bash
   npm install
   ```
3. Create your environment file and fill it in (see [Environment variables](#environment-variables)):
   ```powershell
   Copy-Item .env.example .env     # PowerShell
   cp .env.example .env            # macOS / Linux / Git Bash
   ```
   Paste your Neon connection string into `DATABASE_URL`.
4. Create the tables, then add the default categories and test accounts:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```
5. Start the API:
   ```bash
   npm run dev
   ```
   Open <http://localhost:7000/api/health>. You should see `"API is healthy"`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the API and restarts it when you save a file (`tsx watch`) |
| `npm run build` | Bundles `src/` into `dist/server.mjs` (`tsdown`) |
| `npm start` | Runs the built server (used by Render) |
| `npm run db:plan` | Compares `src/db/schema.ts` with the last migration and writes a new SQL migration into `drizzle/` |
| `npm run db:migrate` | Applies pending migrations to `DATABASE_URL` |
| `npm run db:seed` | Adds default categories, the admin account and the demo user (safe to run again) |
| `npm run db:studio` | Opens Drizzle Studio to browse the database |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript checks |

## Environment variables

| Variable | Example | Purpose |
| --- | --- | --- |
| `PORT` | `7000` | Port to listen on (Render sets this automatically) |
| `NODE_ENV` | `development` / `production` | Production turns on secure cross-site cookies |
| `JWT_SECRET` | 64 random hex characters | Signs access and refresh tokens |
| `CSRF_SECRET` | another random value | Signs CSRF tokens (required in production) |
| `DATABASE_URL` | `postgresql://…neon.tech/neondb?sslmode=require` | Neon connection string |
| `FRONTEND_URL` | `https://recipe-book-web.vercel.app` | Allowed CORS origin(s). Separate several with commas. No trailing slash |
| `BACKEND_URL` | `https://recipe-book-api.onrender.com` | Shown in the startup log |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | | First admin account, created by `db:seed` |
| `DEMO_USER_NAME`, `DEMO_USER_EMAIL`, `DEMO_USER_PASSWORD` | | Optional demo user with 8 sample recipes, created by `db:seed` |
| `APP_TIMEZONE` | `Asia/Manila` | Day boundaries for the admin activity chart |

Generate secrets with:
```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

## How a request flows

```
HTTP request
  → routes/        which URL, which middleware, which controller method
  → middlewares/   AuthMiddleware (who are you?) → CsrfMiddleware (is this POST really from our site?)
                   → RoleValidatorMiddleware (USER or ADMIN?) → SchemaMiddleware (is the body valid? Zod)
  → controllers/   reads req.params / req.query / req.body, calls one service, sends res.status(code).json(result)
  → services/      business rules: ownership, "published recipes must be complete", unique names…
  → repositories/  the only place with database queries (Drizzle)
  → PostgreSQL (Neon)
```

Every response uses the same envelope:

```json
{ "code": 200, "status": "success", "message": "Recipe updated", "data": { "recipe": { } } }
{ "code": 400, "status": "error", "message": "Validation failed", "errors": [{ "path": "body.name", "message": "…" }] }
```

More detail: [docs/architecture.md](docs/architecture.md) · [docs/api-reference.md](docs/api-reference.md) ·
[docs/auth-and-csrf.md](docs/auth-and-csrf.md) · [docs/deployment.md](docs/deployment.md)

## Folder structure

```
src/
├── app.ts / server.ts   Express app (middleware, routes, error handler) and the listener
├── config/env.ts        Reads .env into one typed ENV object
├── db/
│   ├── schema.ts        Tables: user, token, category, recipe
│   ├── index.ts         pg Pool + Drizzle instance
│   ├── seed.ts          npm run db:seed
│   └── demo/            Sample recipes and photos for the demo account
├── routes/              auth, recipes, categories, admin
├── middlewares/         auth, csrf, role, schema validation
├── controllers/         one class per feature
├── services/            one function per file, grouped by feature
├── repositories/        Drizzle queries
├── schema/              Zod request schemas
├── lib/                 jwt, cookies, csrf helpers
└── utils/recipe-image.ts  converts photo uploads to/from database columns
drizzle/                 generated SQL migrations (commit these)
```

## What we added to the tutorial API

| Feature | Where |
| --- | --- |
| **Categories** managed by admins (name, slug, color, show on home, drag-to-reorder) | `category` table, `category-*` files |
| Recipe fields from our Figma: description, servings, structured ingredients (`amount`, `unit`, `name`) | `recipe` table, `recipe-schema.ts` |
| **Drafts**: "Save as draft" only needs a name; published recipes must have a category, ingredients and steps | `status` column, `findMissingFields()` |
| **Favorites** (`favoritedAt` timestamp, so the dashboard can chart them) | `favorite-recipe-service.ts` |
| **Photo uploads**: the browser shrinks the photo, the API stores it and serves it from `GET /recipe-image/:id` | `utils/recipe-image.ts` |
| Search and filters on recipe lists (`?search=&categoryId=&status=&favorites=`) | `recipe-repository.ts` |
| Bulk delete for "Select all" | `delete-recipes-service.ts` |
| **Admin dashboard** stats, activity chart data, recipes per category | `dashboard-repository.ts` |
| Admins can view, edit and delete any recipe | `/v1/admin/*` recipe routes |
| "Keep me logged in" (session cookies when unchecked) | `remember` in `login-service.ts`, `auth-cookies.ts` |
| Cookies work when the frontend and API are on different sites, even with third-party cookies blocked (`SameSite=None; Secure; Partitioned`) | `auth-cookies.ts`, `csrf.ts` |
| Emails are saved in lowercase, so `Juan@Mail.com` and `juan@mail.com` are one account | `signup-service.ts`, `login-service.ts` |
| Removed the unused `nodemailer` dependency | `package.json` |
