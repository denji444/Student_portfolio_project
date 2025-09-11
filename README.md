# Student Portfolio Monorepo

Monorepo containing the React frontend and Express backend for the university software department portfolio.

## Structure
- `frontend/` — Vite + React + TypeScript + Tailwind UI
- `backend/` — Node + Express + TypeScript, Supabase client

## Prerequisites
- Node.js 18+
- npm 9+
- Supabase project (URL and keys)

## Setup
1) Install deps
```
npm install
npm --prefix frontend install
npm --prefix backend install
```

2) Configure env
- Copy `frontend/env.example` to `frontend/.env` and fill values
- Copy `backend/env.example` to `backend/.env` and fill values

Frontend: `VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
Backend: `PORT`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

## Development
```
npm run dev
```
- Frontend: http://localhost:5173
- Backend: http://localhost:4000 (health: `/health`)

## Build
```
npm run build
```

## Start backend (built)
```
npm run start
```
