# Frontend (React + Vite E-commerce UI)

Modern React (Vite) frontend for the E-commerce backend. Provides user & admin interfaces, authentication integration, product browsing, cart, orders, and dashboards.

## Features
- React 19 + Vite
- React Router v7
- Context-based state: `UserContext`, `AdminContext`
- Axios API layer
- Tailwind CSS 4 + custom scrollbar hide plugin
- Charts (Recharts), exporting (xlsx, jsPDF, autotable)
- Toast notifications (react-hot-toast)

## Prerequisites
- Node.js 18+
- Backend API running (see `../Backend`)

## Clone & Setup
```bash
git clone <repo-url>
cd star-1/frontend
npm install
```

## Environment Variables (Optional)
Create a `/.env` (Vite uses `VITE_` prefix):
```
VITE_API_URL=http://localhost:5000
```
In code, access via `import.meta.env.VITE_API_URL`.

## Development
```bash
npm run dev
```
Dev server (default): `http://localhost:5173`

## Build & Preview
```bash
npm run build
npm run preview
```

## Scripts
| Purpose | Command |
|---------|---------|
| Dev | `npm run dev` |
| Build | `npm run build` |
| Preview build | `npm run preview` |
| Lint | `npm run lint` |

## Project Structure (key parts)
```
src/
  main.jsx           # App bootstrap
  App.jsx            # Routes / layout aggregator
  context/
    UserContext.jsx
    AdminContext.jsx
  user/              # User-facing components & pages
  admin/             # Admin-facing components & pages
  assets/            # Static assets
  index.css          # Tailwind entry
```

## Styling
Tailwind configured via `tailwind.config.js` and `@tailwindcss/vite`. Global styles in `src/index.css`.

## API Layer
Typical pattern:
```js
import axios from 'axios';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000' });
```
Ensure CORS + credentials on the backend if using sessions.

## Auth
- Google OAuth flow originates from backend (redirects user to Google)
- Session cookies must be allowed (`withCredentials: true` in axios if needed).

## Production Deployment
Example (Render / Netlify / Vercel):
- Set `VITE_API_URL` env var in the hosting platform.
- Build command: `npm run build`
- Publish directory: `dist`

## Troubleshooting
| Issue | Fix |
|-------|-----|
| CORS errors | Confirm backend `FRONTEND_URL` matches deployed URL |
| 404 on refresh (Router) | Configure host to fallback to `index.html` |
| Missing images | Ensure backend `/uploads` reachable & correct base URL |

## Improvements To Consider
- Centralized error boundary
- Code splitting dynamic routes
- Dark mode theme toggle
- Form validation (e.g., React Hook Form + Zod)
- Testing (Vitest + Testing Library)

## License
Proprietary (adjust as needed).
