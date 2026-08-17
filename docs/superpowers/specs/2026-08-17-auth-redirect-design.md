# Redirect-to-Auth Middleware — Design

Date: 2026-08-17
Status: Approved

## Goal

When a browser navigates to a protected route without valid credentials, the
server should redirect to a login page instead of returning a JSON 401.
API/JSON clients (curl, fetch, supertest) keep receiving `401` JSON, exactly
as they do today.

The login page is a new server-rendered EJS view (`GET /auth/login`). It
submits credentials through the existing `POST /auth/signin` JSON endpoint,
stores the returned JWT in `localStorage` (for the future frontend's API
calls), and relies on a sidecar HttpOnly cookie set at sign-in so that plain
browser navigation is authenticated by the server middleware.

## Decisions

- **Token transport (browser navigation):** sidecar HttpOnly cookie named
  `token`, set by `POST /auth/signin` and `POST /auth/signup`. The cookie
  holds the same JWT the JSON response returns.
- **Token transport (API):** unchanged `Authorization: Bearer <jwt>` header.
  The middleware accepts either source, so existing clients and tests keep
  working.
- **Storage for the frontend:** `localStorage` (set by the login page's JS),
  not read by the server.
- **Redirect vs 401:** redirect happens only when the request "wants HTML" —
  the `Accept` header contains `text/html` (browser navigation). Everything
  else (`*/*`, `application/json`) gets `401`. This preserves the existing
  test suite, which sends no `Accept` header.
- **No new env vars.** Cookie `maxAge` is fixed at 24h; the JWT's own expiry
  (`JWT_EXPIRES_IN=15m`) is re-verified by the middleware, so an expired
  cookie is treated as unauthenticated.
- **Scope:** `/` and `/health` stay public. `/me` and `/tasks` keep the
  existing `authenticate` mount, now with redirect-for-HTML behavior.
  `/auth/*` routes stay public (they are the entry points).

## Components

### 1. `src/middleware/authenticate.ts` (modified)

Behavior on each request:

1. Extract token from `Authorization: Bearer <token>` header, falling back to
   the `token` cookie (`req.cookies.token`).
2. Verify the JWT and load the user as today. On success: attach `req.user`,
   call `next()`.
3. On failure (missing, invalid, expired, or unknown user):
   - If `req.get("accept")` contains `text/html` → `res.redirect("/auth/login")`.
   - Otherwise → throw `AppError(401, ...)` as today.

Because the middleware now reads cookies, `cookie-parser` must be registered
before it in `createApp`.

### 2. `src/utils/authCookie.ts` (new)

- `setAuthCookie(res, token)` → `res.cookie("token", token, { httpOnly: true,
  sameSite: "lax", secure: env.NODE_ENV === "production", maxAge: 24h,
  path: "/" })`.
- `clearAuthCookie(res)` → `res.clearCookie("token", { path: "/" })`.

### 3. `src/controllers/auth.controller.ts` (modified)

- `signUp` and `signIn` call `setAuthCookie(res, token)` before returning the
  existing JSON body. Sign-in/up responses therefore include `Set-Cookie`.
- New `signOut` handler → `clearAuthCookie(res)` + `204 No Content`.

### 4. `src/routes/auth.routes.ts` (modified)

- `GET /auth/login` → renders `views/login.ejs` (`renderLogin` controller in
  `view.controller.ts`, mirroring `renderHome`).
- `POST /auth/signout` → `signOut`.

### 5. `views/login.ejs` (new) + `public/js/login.js` (new)

`login.ejs` reuses the existing partials (`head`, `header`, `footer`) and
renders an email + password form. `login.js` intercepts submit, POSTs JSON to
`/auth/signin`, stores the returned token in `localStorage` under the key
`token`, then `location.href = "/tasks"`. On failure it shows the API's
error message inline. The `Set-Cookie` arrives automatically because the
request is same-origin.

### 6. `package.json` (modified)

Add runtime dependency `cookie-parser` and dev dependency `@types/cookie-parser`.

## Request flow examples

- `GET /tasks` (browser, logged out, `Accept: text/html`) → 302 → `/auth/login`.
- `GET /tasks` (API, no token) → 401 JSON (unchanged).
- `GET /tasks` (browser, valid `token` cookie) → 200 JSON (existing behavior).
- `GET /me` (API, valid Bearer) → 200 (unchanged).

## Testing

Extend `tests/app.test.ts`:

- Browser navigation (`Accept: text/html`) to `/tasks` without a token →
  `302` with `Location: /auth/login`.
- API request to `/tasks` without a token → `401` (already covered; must
  still pass).
- `POST /auth/signin` success → response includes `Set-Cookie: token=...`.
- Authenticated request using only the cookie (no Bearer header) on `/tasks`
  or `/me` → `200`.
- `POST /auth/signout` clears the cookie; a subsequent cookie-only request →
  `401`.
