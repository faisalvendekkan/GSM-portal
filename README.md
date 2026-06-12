# Mobile Repair AI Student Portal

A Hostinger-ready full-stack web application for mobile repair students. The frontend is React + Vite + Tailwind CSS, and the backend is Node.js + Express + Hostinger MySQL/MariaDB.

## Project Structure

```text
/client  React Vite app
/server  Express API and production static server
/server/sql/schema.sql
/server/sql/seed.sql
```

## Local Development

1. Install backend dependencies:

   ```bash
   cd server
   npm install
   ```

2. Install frontend dependencies:

   ```bash
   cd ../client
   npm install
   ```

3. Copy `/server/.env.example` to `/server/.env` and set database credentials. For local HTTP development, use:

   ```env
   NODE_ENV=development
   COOKIE_SECURE=false
   CLIENT_URL=http://localhost:5173
   APP_URL=http://localhost:3000
   ```

4. Import the database:

   ```bash
   cd ../server
   npm run migrate
   npm run seed
   ```

5. Start the backend:

   ```bash
   npm run dev
   ```

6. Start the frontend:

   ```bash
   cd ../client
   npm run dev
   ```

The Vite dev server runs at `http://localhost:5173` and proxies `/api` requests to `http://localhost:3000`.

## Hostinger MySQL Setup

1. Open Hostinger hPanel.
2. Go to **Databases** and create a MySQL database.
3. Copy the database name, username, password, host, and port.
4. Open **phpMyAdmin** for that database.
5. Import `/server/sql/schema.sql`.
6. Import `/server/sql/seed.sql`.

The seed file creates default repair categories and sample articles. It also creates a starter admin user after the bcrypt hash is generated during setup.

## Environment Variables on Hostinger

Create these variables in the Hostinger Node.js App environment panel:

```env
PORT=3000
NODE_ENV=production
APP_URL=https://yourdomain.com
CLIENT_URL=https://yourdomain.com

DB_HOST=localhost
DB_PORT=3306
DB_NAME=your_hostinger_database_name
DB_USER=your_hostinger_database_user
DB_PASSWORD=your_hostinger_database_password

JWT_ACCESS_SECRET=use_a_long_random_access_secret
JWT_REFRESH_SECRET=use_a_different_long_random_refresh_secret
ACCESS_TOKEN_EXPIRES=15m
REFRESH_TOKEN_EXPIRES=7d

COOKIE_SECURE=true

AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=your_gemini_api_key
```

Use long random values for both JWT secrets. Do not reuse the examples from `.env.example`.

## Build for Hostinger

From the project root:

```bash
cd client
npm install
npm run build

cd ../server
npm install --omit=dev
npm start
```

The React production build is written to `/client/dist`. Express serves that folder automatically from `/server/app.js`, including React Router fallback routes.

## Hostinger Node.js App Settings

1. Upload the full project with both `/client` and `/server`.
2. In Hostinger Node.js App, set the application root to the project folder if available.
3. Set the startup file to:

   ```text
   server/app.js
   ```

4. Set environment variables.
5. Run dependency installation for `/server`.
6. Build the React app in `/client`.
7. Restart the Node.js app from hPanel.

## Creating the First Admin User

The seed file includes:

```text
Email: admin@mobilerepair.test
Password: Admin@12345!
```

After the project dependencies are installed, the included seed hash should already match this password. Change the email and password immediately after first login by updating the database record or creating your own admin insert with a fresh bcrypt hash.

To generate a new bcrypt hash:

```bash
cd server
node -e "const bcrypt=require('bcrypt'); bcrypt.hash('NewStrongPassword!123',12).then(console.log)"
```

Put the generated hash into `server/sql/seed.sql` before importing, or update the admin record directly in phpMyAdmin.

## Switching AI Provider

OpenAI is used when:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=...
```

Gemini is used when:

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=...
```

API keys are read only by the Express backend. They are never exposed to React.

## Security Included

- bcrypt password hashing
- JWT access tokens
- In-memory access token storage
- HttpOnly refresh token cookie
- Refresh token rotation and server-side token hashes
- Helmet security headers
- CORS restricted to `CLIENT_URL` and `APP_URL`
- API and login rate limiting
- Role-based admin and student route protection
- express-validator form validation
- URL validation for saved links and media URLs
- Parameterized MySQL queries through `mysql2`
- React text rendering without unsafe HTML injection
- Secure backend error responses

## Troubleshooting

### Database Connection Errors

Check `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD`. Hostinger database names and users often include account prefixes. Confirm the database user has permission for the selected database.

### React 404 Errors After Refresh

Make sure the built `/client/dist` folder exists and the Hostinger startup file is `server/app.js`. Express serves `index.html` for non-API routes so React Router can handle `/dashboard`, `/articles/:slug`, and admin pages.

### Missing Environment Variables

Open `/api/health` first. If the API is running but login or AI fails, check the Hostinger Node.js environment panel and restart the app after edits.

### Refresh Token Cookie Not Working Locally

Use `COOKIE_SECURE=false` for local HTTP development. Use `COOKIE_SECURE=true` only on HTTPS production domains.

### CORS Errors

Set `CLIENT_URL` and `APP_URL` to the exact public domain, including `https://`. If you use both `www` and non-`www`, include both as comma-separated values.

### AI Gives Fallback Responses

The backend returns a safe fallback when no AI key is configured or the provider request fails. Add a valid `OPENAI_API_KEY` or `GEMINI_API_KEY`, set `AI_PROVIDER`, then restart the Node.js app.
