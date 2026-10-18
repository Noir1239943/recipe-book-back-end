# Authentication and CSRF

## Tokens

| Token | Lifetime | Stored | Used for |
| --- | --- | --- | --- |
| Access token (JWT) | 15 minutes | `accessToken` HttpOnly cookie | Every protected request |
| Refresh token (JWT) | 7 days | `refreshToken` HttpOnly cookie + `token` table | Getting a new access token |

HttpOnly cookies cannot be read by JavaScript, so a script injected into the page cannot steal them.

**Rotation:** `POST /auth/v1/refresh-token` marks the old refresh token as consumed and issues a new pair. A refresh token can only be used once; logout revokes it.

**Keep me logged in:** when unchecked, the login sends `remember: false`. The refresh-token cookie then has no `Max-Age`, so it disappears when the browser closes. The choice is stored inside the refresh token, so later refreshes keep it.

## CSRF (cross-site request forgery)

Because the browser sends cookies automatically, another website could try to submit a form to our API while you are logged in. To block that, every POST from the browser must also send a secret header that only our frontend can read.

The API uses the **double-submit** pattern from `csrf-csrf`:

1. `GET /auth/v1/csrf-token` sets a signed CSRF cookie and returns the same token in JSON.
2. The frontend keeps the token in memory and sends it as `x-csrf-token` on every POST.
3. `CsrfMiddleware` checks that the header matches the cookie. Another site cannot read our JSON response, so it cannot know the token.

The token is tied to the login cookies, so the frontend fetches a new one **after login, after a refresh, and after logout** (`src/lib/api.ts` in the frontend does this automatically).

## Frontend flow (what `recipe-book-web/src/lib/api.ts` does)

```
App starts → GET /auth/v1/session
  200 → logged in
  401 → POST /auth/v1/refresh-token (with CSRF) → 200 → new CSRF token → retry /session
                                               → 401 → show the login page

Any request → 401 (access token expired) → refresh once → retry the original request
Any POST → 403 "Invalid or missing CSRF token" → fetch a new CSRF token → retry once
```

## Cookies in production

On Render + Vercel the frontend (`*.vercel.app`) and API (`*.onrender.com`) are **different sites**. To make cookies work:

| Setting | Development | Production | Why |
| --- | --- | --- | --- |
| `SameSite` | `Lax` | `None` | Cookies must be sent on cross-site fetches |
| `Secure` | no | yes | Browsers require `Secure` with `SameSite=None` (HTTPS only) |
| `Partitioned` | no | yes | Browsers that block third-party cookies (Safari, Chrome Incognito) still accept them, scoped to our frontend |
| CSRF cookie names | `csrf-session`, `csrf-token` | `__Host-csrf-session`, `__Host-csrf-token` | `__Host-` makes the browser require HTTPS, `Path=/` and no `Domain` |

CORS (`app.ts`) only allows origins listed in `FRONTEND_URL` and sets `credentials: true`, so other websites cannot read our responses.
