# PTUT Student Portfolio — Frontend

Vite + React + TypeScript frontend for the PTUT (Punjab Tianjin University of Technology) Software Engineering Technology student portfolio.

Live site: https://student-portfolio-gppt.onrender.com/

## Tech Stack
- Vite, React 18, TypeScript
- Tailwind CSS, shadcn/ui (Radix primitives)
- React Router, TanStack Query
- Supabase (auth, storage integration via backend)

## Local Development
From repo root (monorepo), run:

```bash
npm install
npm --prefix frontend install
npm --prefix backend install

npm run dev
```

Dev servers:
- Frontend: http://localhost:8080 (Vite; proxies /api to backend)
- Backend: http://localhost:4000

## Environment Variables
Create `frontend/.env` and set:

```
VITE_SITE_URL=https://student-portfolio-gppt.onrender.com
VITE_OG_IMAGE=https://student-portfolio-gppt.onrender.com/ptut-logo.png
# Optional: override backend API base; by default relative /api is proxied in dev
# VITE_API_BASE_URL=https://student-portfolio-gppt.onrender.com
```

## SEO
- Global tags in `index.html`
- Reusable `<SEO />` component in `src/components/SEO.tsx` for per-page meta, OG/Twitter, canonical, and JSON‑LD.
- `public/robots.txt` and `public/sitemap.xml` are included.

## Useful Scripts
```bash
npm run dev       # start frontend and backend together (monorepo root)
npm --prefix frontend run build
npm --prefix frontend run preview
```

## Project Structure (frontend)
```
frontend/
  public/            # static assets, robots.txt, sitemap.xml
  src/
    components/      # UI components
    pages/           # route components
    lib/             # API/supabase helpers
    hooks/           # custom hooks
    types/           # shared types
```

## Deployment
Build the frontend from repo root:

```bash
npm --prefix frontend run build
```

Serve `frontend/dist` behind your preferred host (Render, Netlify, etc.). The backend serves API on port 4000 in development and your hosted URL in production.

## Notes
- Thumbnail uploads: performed via backend endpoint `/api/projects/upload-thumbnail` (service role), not directly to Supabase from the browser.
- Auth cookies: Vite dev proxy ensures same‑origin cookies in development.
