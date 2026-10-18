# Deployment: Neon + Render + Vercel

Order: **database → API → frontend → connect the API back to the frontend**.

## 1. Neon (PostgreSQL)

1. Open your project on <https://console.neon.tech>.
2. Click **Connect** (top of the dashboard). Choose the `neondb` database and copy the connection string. It looks like:
   ```
   postgresql://neondb_owner:********@ep-xxxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   ```
3. Keep it private. It goes into Render's environment variables (and your local `.env`), never into Git.

## 2. Render (API)

1. Push `recipe-book-api` to GitHub.
2. <https://dashboard.render.com/web/new> → **Git Provider** → pick `recipe-book-api`.
3. Settings:

   | Field | Value |
   | --- | --- |
   | Name | `recipe-book-api` (this becomes `https://recipe-book-api.onrender.com`; Render adds a suffix if the name is taken) |
   | Language | Node |
   | Branch | `main` |
   | Region | Singapore (closest to the Philippines) |
   | Build Command | `npm ci --include=dev && npm run build && npm run db:migrate && npm run db:seed` |
   | Start Command | `npm start` |
   | Instance Type | Free |

   `--include=dev` matters: with `NODE_ENV=production`, npm would otherwise skip the build tools (`tsdown`, `drizzle-kit`, `tsx`). The build command also creates/updates the tables and seeds the categories and test accounts on every deploy (safe to repeat).

4. **Environment Variables** (Advanced → Add Environment Variable):

   | Key | Value |
   | --- | --- |
   | `NODE_ENV` | `production` |
   | `APP_NAME` | `Recipe Book API` |
   | `DATABASE_URL` | your Neon connection string |
   | `JWT_SECRET` | click **Generate** |
   | `CSRF_SECRET` | click **Generate** |
   | `FRONTEND_URL` | `http://localhost:5173` for now; you replace it in step 4 |
   | `BACKEND_URL` | `https://<your-service>.onrender.com` |
   | `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` | your admin test account (password: 8+ characters, an uppercase letter and a number) |
   | `DEMO_USER_NAME` / `DEMO_USER_EMAIL` / `DEMO_USER_PASSWORD` | your user test account (gets 8 sample recipes) |
   | `APP_TIMEZONE` | `Asia/Manila` |

5. Click **Deploy Web Service**. When the log says `Recipe Book API started successfully!`, open `https://<your-service>.onrender.com/api/health`.

## 3. Vercel (frontend)

1. Push `recipe-book-web` to GitHub.
2. <https://vercel.com/new> → import `recipe-book-web`. Vercel detects **Vite** (build `npm run build`, output `dist`).
3. **Environment Variables**:

   | Key | Value |
   | --- | --- |
   | `VITE_API_URL` | `https://<your-service>.onrender.com/api` |

4. **Deploy**. Copy the production URL, e.g. `https://recipe-book-web.vercel.app`.

`VITE_` variables are built into the JavaScript at build time. If you change `VITE_API_URL` later, redeploy the frontend.

## 4. Connect the API to the frontend

Back in Render → your service → **Environment** → set:

```
FRONTEND_URL = https://recipe-book-web.vercel.app
```

No trailing slash. To allow several origins (e.g. also local dev), separate them with commas:
`https://recipe-book-web.vercel.app,http://localhost:5173`.
Save; Render redeploys automatically.

## 5. Check it

1. Open the Vercel URL. The first load can take up to a minute while Render's free instance wakes up; the app shows a "Waking up the server…" message.
2. Log in with the demo user → you should see the 8 sample recipes.
3. Log out, log in with the admin → Dashboard, Recipes and Categories.
4. In DevTools → Network, requests go to `https://<your-service>.onrender.com/api/...`, **not** localhost.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| Browser console: **CORS error** | `FRONTEND_URL` on Render must exactly match the Vercel URL (https, no trailing slash) |
| Requests go to `localhost:7000` | `VITE_API_URL` was missing when Vercel built the app. Add it, then **Redeploy** |
| Build fails: `tsdown: not found` | The build command needs `npm ci --include=dev` |
| `DATABASE_URL is required` / connection errors | Check the Neon string in Render, including `?sslmode=require` |
| `relation "recipe" does not exist` | Migrations did not run; check the build log for `db:migrate` |
| 403 `Invalid or missing CSRF token` on every POST | `NODE_ENV` must be `production` on Render (secure cross-site cookies), and `CSRF_SECRET` must be set |
| Refreshing a page on Vercel shows 404 | `vercel.json` (in the frontend repo) must be committed; it sends every path to `index.html` |
| First request is slow | Normal on Render's free plan (it sleeps after 15 minutes of no traffic) |
| Log shows `SECURITY WARNING: The SSL modes 'prefer', 'require'…` | Only a notice from the `pg` driver. To silence it, change `sslmode=require` to `sslmode=verify-full` in `DATABASE_URL` |
