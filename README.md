# Mobile Repair AI Student Portal

Single Hostinger-ready Node.js app for the Mobile Repair AI Student Portal.

The Express server serves both the React production build and every `/api` route. No separate backend domain, Vite-only deployment, MySQL, MongoDB, or external database is required.

## Stack

- Frontend: existing React + Vite app in `client/`
- Backend: Node.js + Express in `server/`
- Database: SQLite file at `server/data/app.sqlite`
- SQLite runtime: `sql.js`
- Passwords: bcrypt hashes
- Auth: JWT access token plus HttpOnly refresh-token cookie
- AI: Gemini through `GEMINI_API_KEY`

## Production URL

```text
https://gsm.abilix.in
https://gsm.abilix.in/api
```

The frontend should call same-origin API routes with `/api`.

## Required Environment Variables

Use Hostinger's Node.js environment variable panel or a `.env` file.

```env
NODE_ENV=production
PORT=3000
APP_URL=https://gsm.abilix.in
CLIENT_URL=https://gsm.abilix.in
JWT_ACCESS_SECRET=replace_with_long_random_secret
JWT_REFRESH_SECRET=replace_with_another_long_random_secret
ACCESS_TOKEN_EXPIRES=15m
REFRESH_TOKEN_EXPIRES=7d
COOKIE_SECURE=true
AI_PROVIDER=gemini
GEMINI_API_KEY=optional_gemini_key
GEMINI_MODEL=gemini-2.5-flash
SQLITE_DB_PATH=server/data/app.sqlite
VITE_API_URL=/api
DEFAULT_ADMIN_EMAIL=info@abilix.in
DEFAULT_ADMIN_PASSWORD=AbiPassword@123
DEFAULT_STUDENT_EMAIL=student@gsmportal.local
DEFAULT_STUDENT_PASSWORD=Student@12345!
RESET_DEFAULT_ADMIN=true
ADMIN_RESET_KEY=replace_with_long_private_reset_key
```

After admin login works in production, change:

```env
RESET_DEFAULT_ADMIN=false
```

With `RESET_DEFAULT_ADMIN=true`, every server startup force-resets the configured admin password.

## Default Logins

Admin:

```text
Email: info@abilix.in
Password: AbiPassword@123
```

Student:

```text
Email: student@gsmportal.local
Password: Student@12345!
```

These values come from environment variables when provided. Email values are trimmed, lowercased, and repaired if a `mailto:` string is accidentally pasted.

## Local Setup

```bash
npm install
npm run build
npm start
```

Open:

```text
http://localhost:3000
http://localhost:3000/api/health
```

For local HTTP, use `COOKIE_SECURE=false`.

## Hostinger Setup

Recommended settings:

```text
Framework: Express
Node version: 22.x or 20.x
Root directory: /
Entry file: server/app.js
Package manager: npm
Install command: npm install
Build command: npm run build
Start command: npm start
```

Deploy the whole project. Do not deploy `client/dist` as a separate Vite site. Express serves `client/dist` and all non-API routes fall back to `client/dist/index.html`, so React Router refreshes do not 404.

## Package Scripts

```json
{
  "postinstall": "cd client && npm install --include=dev && npm run build",
  "build": "cd client && npm install --include=dev && npm run build",
  "start": "node server/app.js",
  "dev": "node server/app.js",
  "init-db": "node server/db/initDb.js",
  "reset-admin": "node server/scripts/resetAdmin.js"
}
```

## Database Behavior

The app uses local SQLite through `sql.js`.

Startup order:

1. Load environment variables.
2. Create `server/data` if missing.
3. Open or create the SQLite file.
4. Create missing tables and indexes.
5. Seed default categories.
6. Create or reset the configured admin.
7. Create the configured default student if missing.
8. Start the Express server.

`sql.js` does not persist automatically. The app exports and writes the database back to `SQLITE_DB_PATH` after inserts, updates, deletes, schema creation, seeds, and admin reset.

If the SQLite file is corrupt, the app backs it up as `app.sqlite.corrupt-...` and creates a fresh database.

## Health Check

```text
GET /api/health
```

Expected:

```json
{
  "ok": true,
  "app": "Mobile Repair AI Student Portal",
  "database": "sqlite",
  "tablesReady": true,
  "adminReady": true,
  "studentReady": true,
  "status": "running"
}
```

## Emergency Admin Reset

```text
POST /api/admin-reset
Content-Type: application/json
```

Body:

```json
{
  "key": "ADMIN_RESET_KEY value"
}
```

Success:

```json
{
  "ok": true,
  "message": "Admin reset completed",
  "email": "info@abilix.in"
}
```

If `ADMIN_RESET_KEY` is missing or wrong, the reset does not run. This endpoint never returns passwords, password hashes, JWT secrets, or environment variables.

You can also run:

```bash
npm run reset-admin
```

## Safe Debug Check

```text
GET /api/debug/auth-status
x-admin-reset-key: ADMIN_RESET_KEY value
```

Returns safe status only: configured admin email, whether admin exists, role, status, student status, and table readiness. It never returns hashes or secrets.

## Public Registration

Public self-registration is disabled.

```text
POST /api/auth/register
```

Returns:

```json
{
  "message": "Public registration is disabled. Contact administrator."
}
```

The public create-account links are removed. Admin-created users in `/admin/users` still work.

## Admin User Management

After admin login:

```text
/admin/users
```

Admins can view, create, edit, delete, activate/deactivate/suspend users, change roles, and reset passwords.

Protections:

- Admin cannot delete their own account.
- Admin cannot deactivate or suspend their own account.
- Admin cannot remove their own admin role.
- Admin-created user emails are normalized.
- Password resets use bcrypt.
- Important actions are audit logged.

## API Routes

Auth:

- `POST /api/auth/login`
- `POST /api/auth/admin/login`
- `POST /api/auth/admin-login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `GET /api/auth/me`

Admin reset and debug:

- `POST /api/admin-reset`
- `GET /api/debug/auth-status`

Core:

- `GET /api/health`
- `GET /api/categories`
- `GET /api/dashboard`
- `GET /api/dashboard/student`
- `GET /api/dashboard/admin`
- `GET /api/notes`
- `GET /api/links`
- `GET /api/articles`
- `GET /api/ai/history`
- `POST /api/ai/chat`

AI chat accepts JSON text-only requests:

```json
{
  "question": "Phone charging shows but percentage is not increasing"
}
```

It also accepts `multipart/form-data` with `message` and an optional `image` file. Supported image types are JPEG, PNG, and WebP up to 8 MB. Images are kept in memory only and sent directly to Gemini as inline base64 content; the SQLite chat history stores only the question, answer, provider, timestamp, and `image_attached` flag.

The AI Assistant page supports camera capture, image upload, image removal, and browser speech-to-text. Browser camera access requires HTTPS in production, which is satisfied by `https://gsm.abilix.in`.

Admin:

- `GET /api/admin/users`
- `GET /api/admin/users/:id`
- `POST /api/admin/users`
- `PUT /api/admin/users/:id`
- `DELETE /api/admin/users/:id`
- `PATCH /api/admin/users/:id/status`
- `PATCH /api/admin/users/:id/role`
- `PATCH /api/admin/users/:id/reset-password`

## Troubleshooting

### Correct admin login still returns 401

Check:

- `DEFAULT_ADMIN_EMAIL=info@abilix.in`
- `DEFAULT_ADMIN_PASSWORD=AbiPassword@123`
- `RESET_DEFAULT_ADMIN=true`
- Restart the Hostinger Node app.
- Visit `/api/health` and confirm `adminReady:true`.
- Call `/api/debug/auth-status` with `x-admin-reset-key`.
- Run `npm run reset-admin` if SSH/terminal is available.

### Too many login attempts

Wait 15 minutes or restart the app. The auth rate limiter protects login endpoints.

### Client build missing

Run:

```bash
npm run build
```

The server expects:

```text
client/dist/index.html
```

### Vite command not found

Run from the root:

```bash
npm install
npm run build
```

The root `postinstall` installs client dev dependencies, including Vite.

### React Router refresh gives 404

Use the Express app URL, not a separate static-only host. Express sends `client/dist/index.html` for non-API routes.

### SQLite data backup

Back up this file before deleting or redeploying over real data:

```text
server/data/app.sqlite
```

Do not delete `app.sqlite` after real users start using the app unless you intentionally want a fresh database.

### CORS errors

Production is same-origin and should call `/api`. Set:

```env
APP_URL=https://gsm.abilix.in
CLIENT_URL=https://gsm.abilix.in
```

Do not use `gsm-api.abilix.in` or localhost in production.

### Gemini not configured

If `GEMINI_API_KEY` is missing, AI routes return:

```text
English:
AI service is not configured yet. Please add GEMINI_API_KEY in environment variables, then try again.

Malayalam:
AI service is not configured yet. Please add GEMINI_API_KEY, then try again.
```

## Final Deployment Checklist

Before publishing:

```bash
npm install
npm run build
npm start
```

Then verify:

- `/api/health` returns `adminReady:true` and `studentReady:true`.
- `POST /api/admin-reset` works with `ADMIN_RESET_KEY`.
- Admin login works: `info@abilix.in / AbiPassword@123`.
- Student login works: `student@gsmportal.local / Student@12345!`.
- Public registration returns `403`.
- Create-account link is gone.
- `/register` redirects to `/login`.
- Admin can create a user.
- Admin can reset a student password.
- Admin cannot delete their own account.
- Refreshing `/admin` or `/dashboard` does not 404.
- No MySQL, MongoDB, or external database errors appear.
