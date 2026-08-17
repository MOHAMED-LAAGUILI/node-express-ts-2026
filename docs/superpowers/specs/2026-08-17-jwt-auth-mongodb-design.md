# JWT Authentication + MongoDB Integration — Design

Date: 2026-08-17
Status: Approved

## Goal

Add a full authentication system to the Express 5 + TypeScript scaffold:
sign-up, sign-in, password reset, JWT-protected routes, and MongoDB
persistence. Tasks move from the in-memory array into MongoDB, scoped per
user, so no resource is accessible without authentication.

## Decisions

- **Stack (Approach A):** Mongoose ODM, `jsonwebtoken`, `bcryptjs`
  (pure-JS bcrypt — no native build issues on Windows/Node 26).
- **Token transport:** `Authorization: Bearer <jwt>` header. SPA-friendly
  for the upcoming Vite React frontend; no CSRF surface.
- **Password reset:** token-based, no email. A sha256-hashed reset token is
  stored; the raw token is returned in the response as a dev convenience
  until nodemailer is added.
- **Protection scope:** all `/tasks` CRUD and `/me` require auth. `/auth/*`,
  `/health`, static assets, and the landing page stay public. The SSR tasks
  EJS view is removed (temporary views are being replaced by Vite React).

## Environment (`config/env.ts`, zod-validated)

| Variable | Required | Default | Notes |
|---|---|---|---|
| `MONGODB_URI` | yes | — | Works with local or Atlas |
| `JWT_SECRET` | yes | — | min 32 chars |
| `JWT_EXPIRES_IN` | no | `15m` | jsonwebtoken style |
| `PASSWORD_RESET_TOKEN_TTL_MINUTES` | no | `15` | |

## Models

- **User:** `name`, `email` (unique, lowercase, trim), `password`
  (`select: false`, pre-save hashed with bcryptjs rounds 10), `role`
  (`user`/`admin`, default `user`), timestamps. Instance method
  `comparePassword(candidate)`.
- **PasswordResetToken:** `userId` (ref User, indexed), `tokenHash`
  (sha256 of raw token), `expiresAt`, timestamps.
- **Task:** `title`, `completed` (default false), `owner` (ref User,
  indexed), timestamps.

## Services

- **tokenService:** `signJwt(userId, role)`, `verifyJwt(token)`,
  `generateResetToken()` → raw hex + sha256 hash.
- **authService:** `signUp` (409 on duplicate email), `signIn` (401 on bad
  credentials), `requestPasswordReset` (always 200; returns raw token when a
  user exists, none otherwise — prevents email enumeration),
  `resetPassword` (hash lookup, expiry + used checks, rehash).
- **userService:** `findById(id)` → safe user (password excluded).
- **taskService:** async Mongoose CRUD, every operation scoped by `owner` —
  404 if the task does not exist or is not owned by `req.user.id`.

## Middleware

- **authenticate:** reads Bearer token, verifies JWT, loads the user,
  attaches `req.user`; 401 on missing/invalid/unknown user. Express 5
  auto-forwards async rejections, so handlers can be `async` and throw.
- **errorHandler:** extended to map Mongoose errors — `CastError` → 400,
  `ValidationError` → 400, duplicate key `11000` → 409.

## Routes

- Public: `POST /auth/signup`, `POST /auth/signin`,
  `POST /auth/request-password-reset`, `POST /auth/reset-password`,
  `GET /health`, landing page.
- Protected: `GET /me`; `/tasks` CRUD mounted with `authenticate`.

## Bootstrap

`server.ts` becomes an async main: connect to Mongo (fail fast), create app,
listen, keep graceful shutdown + unhandledRejection/uncaughtException
handlers. DB connection lives in `config/db.ts`.

## Testing

`tests/app.test.ts` reworked with `mongodb-memory-server` (no local install
needed): 401 without token, signup → signin → authenticated task CRUD,
per-user task isolation, password reset round-trip.
