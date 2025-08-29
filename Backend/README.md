# Backend (E-commerce API)

TypeScript + Express + Prisma + PostgreSQL API for products, categories, banners, cart, orders, users, auth (credentials + Google OAuth) and addresses.

## Features
- User auth (session + Google OAuth)
- Role-based admin (ADMIN / USER)
- Product, Category, Banner CRUD (with image upload via Multer)
- Cart and Order management with stock adjustments
- Address management per user
- Prisma ORM with PostgreSQL

## Tech Stack
- Node.js / TypeScript / Express
- Prisma + PostgreSQL
- Passport (Google OAuth) & express-session
- Multer for file uploads (stored in `uploads/`)

## Prerequisites
- Node.js 18+
- PostgreSQL database (Neon / Render / Local)
- Git

## Clone & Setup
```bash
git clone <repo-url>
cd star-1/Backend
cp .env.example .env   # (If you create one; else edit existing .env)
```

Populate `.env` (example):
```
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
SHADOW_DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
PORT=5000
SESSION_SECRET="replace_with_strong_secret"
JWT_SECRET="your_jwt_secret"
JWT_REFRESH_SECRET="your_refresh_secret"
FRONTEND_URL="http://localhost:5173"
GOOGLE_CLIENT_ID="...apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="..."
GOOGLE_CALLBACK_URL="http://localhost:5000/auth/google/callback"
```

## Install Dependencies
```bash
npm install
```

## Database & Prisma
Generate client:
```bash
npx prisma generate
```
Run dev migrations (creates / updates schema):
```bash
npx prisma migrate dev --name init
```
View data:
```bash
npx prisma studio
```
Deploy migrations in production:
```bash
npx prisma migrate deploy
```

## Development
```bash
npm run dev
```
API runs on: `http://localhost:5000`

## Build & Run (Production style)
```bash
npm run build
node dist/index.js
```

## Directory Structure (key parts)
```
src/
  index.ts            # App entry
  controllers/        # Route handlers
  routes/             # Express routers
  middleware/         # Auth, validation, uploads
  config/             # db, passport, (redis stub removed)
  lib/                # prisma helper, (kong script neutralized)
  uploads/            # Stored image files (ephemeral in cloud unless persisted)
prisma/schema.prisma  # DB schema
```

## Image Uploads
Uploaded images are saved to `uploads/` and served via `/uploads/<filename>`. For cloud hosting use a persistent volume or external storage (S3/R2) to avoid data loss on redeploy.

## Sessions
Currently uses the default in-memory session store (OK for development). For production use a persistent store (e.g. `connect-pg-simple`) to avoid losing sessions on restarts.

## CORS
CORS origin is taken from `FRONTEND_URL` or defaults to a hard-coded local network value—set `FRONTEND_URL` in `.env` for correctness.

## Auth Routes (examples)
- `POST /auth/login`
- `POST /auth/register`
- `GET /auth/google` (redirect)
- `GET /auth/google/callback`

## Product Routes (examples)
- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/products` (multipart/form-data with images)

## Orders
Creates an order adjusting stock inside a Prisma transaction.

## Environment Notes
- Remove any real secrets before committing.
- Do not store plaintext passwords (bcrypt hashing implemented).

## Common Scripts
| Purpose | Command |
|---------|---------|
| Dev server | `npm run dev` |
| Build | `npm run build` |
| Start built app | `npm start` |
| Prisma generate | `npx prisma generate` |
| Prisma migrate dev | `npx prisma migrate dev --name <name>` |
| Prisma migrate deploy | `npx prisma migrate deploy` |
| Prisma studio | `npx prisma studio` |

## Deployment (Example: Render)
Build Command:
```
npm install && npx prisma generate && npm run build && npx prisma migrate deploy
```
Start Command:
```
node dist/index.js
```
Ensure environment variables are set in the platform dashboard.

## Future Improvements
- Move uploads to object storage
- Add persistent session store
- Add rate limiting & logging aggregation
- Implement tests (Jest / Supertest)

## License
Proprietary (adjust as needed).
