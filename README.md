# LIN E-Learning Backend

Express + TypeScript API with **MySQL** as the sole data store. No in-memory business data.

## Stack

- Node.js, Express 5, TypeScript
- `mysql2` connection pool
- JWT access + refresh tokens (refresh hashes stored in DB)

## Setup

```bash
cp .env.example .env
# Edit: DB_*, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, CORS_ORIGIN, PORT

# Apply schema (MySQL 8+)
mysql -u "$DB_USER" -p "$DB_NAME" < sql/schema.sql

npm install
npm run dev    # tsx watch
# or
npm run build && npm start
```

## Environment

| Variable | Required | Notes |
|----------|----------|--------|
| `DB_HOST` | no | default `127.0.0.1` |
| `DB_PORT` | no | default `3306` |
| `DB_USER` | yes | |
| `DB_PASSWORD` | yes | |
| `DB_NAME` | yes | |
| `JWT_ACCESS_SECRET` | yes | |
| `JWT_REFRESH_SECRET` | yes | |
| `ACCESS_TOKEN_TTL` | no | default `15m` |
| `REFRESH_TOKEN_TTL` | no | default `7d` |
| `CORS_ORIGIN` | no | default reflect all |
| `PORT` | no | default `4000` |

## API prefix

All routes are under `/api`.

### Auth

| Method | Path | Notes |
|--------|------|--------|
| POST | `/auth/login` | body: email, password, optional role |
| POST | `/auth/register` | public → **student only**; admin Bearer may create lecturer/admin |
| POST | `/auth/refresh` | body: refreshToken |
| GET | `/auth/me` | Bearer |
| POST | `/auth/logout` | Bearer; body: refreshToken |

### Resources (Bearer required)

- `GET/POST/PUT/DELETE /users` — list/create admin-only; update self or admin
- `GET/POST/PUT/DELETE /courses`
- `GET/POST/PUT/DELETE /lessons`
- `GET/POST /enrollments`, `PATCH /enrollments/:id/progress`
- `GET/POST/PUT/DELETE /questions`
- `GET/POST/PUT/DELETE /exams`, `POST /exams/:id/submit`
- `GET /results`
- `GET /admin/dashboard` — aggregate counts from DB

## Security notes

- Public registration cannot create `admin` or `lecturer` without a valid admin access token.
- Admin `POST /users` creates accounts without issuing tokens for the new user (caller session unchanged).
- Students can only update/read their own user record.
- Refresh tokens are hashed (SHA-256) in `refresh_tokens` and rotated on refresh.

## Health

`GET /api/health` → `{ ok: true, service: "LIN-E-Learning-API" }`
