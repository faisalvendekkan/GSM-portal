# Mobile Repair AI Student Portal

Production-ready single Node.js application for the Mobile Repair AI Student Portal.

The React frontend, Express API, authentication, admin panel, notes, saved links, articles, AI assistant, and SQLite database run from one deployable app.

## Stack

- Frontend: React + Vite
- Styling: existing Tailwind UI
- Backend: Node.js + Express
- Database: SQLite file at `server/data/app.sqlite`
- SQLite package: `sql.js`
- Auth: JWT access token + HttpOnly refresh token cookie
- Passwords: bcrypt hashes
- Security: Helmet, CORS, rate limiting, express-validator
- AI: Gemini with `GEMINI_API_KEY`

No external database is required.

## Default Admin

Created automatically only when no admin exists:

```text
Email: admin@gsmportal.local
Password: Admin@12345!
```

Change this password after first login.

## Local Production Setup

Run from the project root:

```bash
npm install
cp .env.example .env
npm run build
npm start
```

Open:

```text
http://localhost:3000
```

Health check:

```text
http://localhost:3000/api/health
```

Expected:

```json
{
  "ok": true,
  "app": "Mobile Repair AI Student Portal",
  "database": "sqlite",
  "status": "running"
}
```

## Development Mode

Terminal 1:

```bash
npm run dev
```

Terminal 2:

```bash
cd client
npm run dev
```

Frontend dev server:

```text
http://localhost:5173
```

The Vite proxy forwards `/api` to `http://localhost:3000`. In production there is no separate frontend/backend URL; the React app calls `/api` on the same origin.

## Hostinger Deployment

Use one Hostinger Node.js app.

Recommended settings:

```text
Framework: Express
Node version: 22.x
Root directory: project root
Entry file: server/app.js
Install command: npm install
Build command: npm run build
Start command: npm start
```

Steps:

1. Upload the full project or connect GitHub.
2. Set the Hostinger Node app root to the project root.
3. Set entry file to `server/app.js`.
4. Add environment variables from `.env.example`.
5. Run install command `npm install`.
6. Run build command `npm run build`.
7. Start/restart the app with `npm start`.
8. Visit `/api/health`.
9. Login with the default admin if this is the first startup.

## Environment Variables

Use `.env.example` as the template:

```env
NODE_ENV=production
PORT=3000
APP_URL=https://yourdomain.com
CLIENT_URL=https://yourdomain.com
JWT_ACCESS_SECRET=replace_with_long_random_secret
JWT_REFRESH_SECRET=replace_with_another_long_random_secret
ACCESS_TOKEN_EXPIRES=15m
REFRESH_TOKEN_EXPIRES=7d
COOKIE_SECURE=true
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_optional
GEMINI_MODEL=gemini-2.5-flash
SQLITE_DB_PATH=server/data/app.sqlite
```

There are no database host/user/password variables. SQLite is local and automatic.

## Database

The app creates this file automatically:

```text
server/data/app.sqlite
```

The server creates the `server/data` folder if it does not exist.

Tables are created automatically on startup:

- `users`
- `categories`
- `notes`
- `saved_links`
- `articles`
- `ai_chats`
- `refresh_tokens`
- `audit_logs`

Seeded categories are inserted automatically. The first admin is created only if no admin account exists.

## Manual Database Initialization

```bash
npm run init-db
```

You usually do not need this because startup initializes the database automatically.

## Backup Database

Stop the app or make sure there are no active writes, then copy:

```text
server/data/app.sqlite
```

Keep that file safe. It contains users, notes, links, articles, AI chats, refresh tokens, and audit logs.

## Reset Database Safely

1. Stop the Node app.
2. Back up `server/data/app.sqlite`.
3. Delete `server/data/app.sqlite`.
4. Start the app again.

The app will create a fresh database and default admin.

## Change Admin Password

Login as admin, open:

```text
/admin/users
```

Use the user management reset password action.

If you need a manual bcrypt hash:

```bash
node -e "const bcrypt=require('bcrypt'); bcrypt.hash('NewStrongPassword!123',12).then(console.log)"
```

Then update the relevant `users.password_hash` value with your preferred SQLite tool.

## Generate JWT Secrets

Use long random strings:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Generate two different values:

- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

## Gemini API

Set:

```env
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
```

If no key is configured, the AI assistant will not crash. It returns:

```text
AI service is not configured yet. Please add GEMINI_API_KEY in environment variables.
```

## Important Routes

Auth:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/admin-login`
- `POST /api/auth/admin/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `GET /api/auth/me`

Dashboard:

- `GET /api/dashboard`
- `GET /api/dashboard/student`
- `GET /api/dashboard/admin`

Admin user management:

- `GET /api/admin/users`
- `GET /api/admin/users/:id`
- `POST /api/admin/users`
- `PUT /api/admin/users/:id`
- `DELETE /api/admin/users/:id`
- `PATCH /api/admin/users/:id/status`
- `PATCH /api/admin/users/:id/role`
- `PATCH /api/admin/users/:id/reset-password`

## Troubleshooting

### Login Fails

Check:

- `/api/health` returns ok.
- The database file exists at `server/data/app.sqlite`.
- The user status is `active`.
- You are using the correct admin route: `/admin/login`.
- `COOKIE_SECURE=false` for local HTTP.
- `COOKIE_SECURE=true` for HTTPS production.

### Missing React Build

If the browser says the React production build is missing, run:

```bash
npm run build
```

The build must exist at:

```text
client/dist
```

### React Router Refresh 404

Use `npm start` and open the Express app URL. Express serves `client/dist/index.html` for frontend routes such as `/dashboard`, `/admin/users`, and `/articles/:slug`.

### File Permission Problems

Hostinger must allow the Node app to write to:

```text
server/data
```

If SQLite cannot create or update the database, check folder write permissions.

### API 404

API routes start with `/api`. Frontend routes do not.

Examples:

```text
/api/health
/api/auth/login
/api/admin/users
```

### AI Not Responding

If `GEMINI_API_KEY` is missing, the app returns a safe configuration message. Add the key and restart the app.

### CORS Problems

Production is same-origin, so CORS should not block. In development, allowed origins are:

```text
http://localhost:5173
http://localhost:3000
```

Set `APP_URL` and `CLIENT_URL` to your production domain on Hostinger.

## Publish Checklist

Before publishing:

```bash
npm install
npm run build
npm start
```

Check:

- `/api/health` is ok.
- Admin login works.
- Student registration works.
- Admin can create/edit/reset/deactivate users.
- Notes add/edit/delete works.
- Saved links add/edit/delete works.
- Articles load.
- AI fallback works without Gemini key.
- AI works with Gemini key.
- Refreshing `/dashboard` does not 404.
- Logout works.

## Cleanup

Old archive artifacts were removed from the project. Deploy from the source files in this folder.
