# PS-227 Satellite Change Analysis Dashboard

An interactive satellite change analysis dashboard for Smart India Hackathon 2026.

## Problem Statement

**PS-227 — Semantic Retrieval and Multi-Temporal Change Analysis of Satellite Imagery.** The project explores a natural-language workflow for selecting an area of interest and reviewing illustrative change analysis across time.

## Features

- Natural-language query parsing and OpenStreetMap Nominatim geocoding.
- Interactive Leaflet map with OpenStreetMap, terrain, and satellite-style basemaps.
- AI analysis summary and deterministic mock fallback when Gemini is unavailable.
- Analysis timeline, KPI cards, analytics charts, and before/after comparison.
- Saved analyses, recent searches, recommendations, metadata, and report exports.
- FastAPI backend with SQLite persistence, structured schemas, and API documentation.

Analysis results are demonstrations. The current backend uses Gemini for text analysis when configured and returns deterministic mock analysis on Gemini service failures. The project does not download or process satellite imagery; map tiles are provided by their respective public providers.

## Tech Stack

- Frontend: React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Leaflet / React Leaflet, Recharts.
- Backend: Python, FastAPI, Pydantic, SQLAlchemy, Alembic, SQLite, `google-genai`.
- Geocoding: OpenStreetMap Nominatim.

## Requirements

- Node.js 18 or newer and npm.
- Python 3.10 or newer (use a Python version supported by all packages in `backend/requirements.txt`).
- Gemini API key is optional; without it, the backend uses mock analysis responses.

## Installation

Install frontend dependencies from the repository root:

```powershell
npm ci
```

Create and activate a backend virtual environment, then install Python dependencies:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
```

## Run Frontend

```powershell
npm run dev
```

Vite serves the app at `http://localhost:5173` by default. To configure a different backend URL, copy `.env.example` to `.env` and set `VITE_API_URL`. Local `.env` files are ignored by Git.

## Run Backend

Copy the backend template and optionally set a Gemini key in your local file:

```powershell
Copy-Item backend/.env.example backend/.env
# Edit backend/.env locally; never commit it.
uvicorn backend.main:app --reload
```

The API runs at `http://127.0.0.1:8000`. Interactive API documentation is available at `/docs`; health check is `/health`. The SQLite database is created locally at `backend/data/ps227.sqlite` and is ignored by Git.

## Environment Variables

| File | Variable | Purpose |
| --- | --- | --- |
| `.env` (optional) | `VITE_API_URL` | Frontend API base URL; defaults to the local backend. |
| `backend/.env` (local only) | `GEMINI_API_KEY` | Optional server-side Gemini credential. |
| `backend/.env` (local only) | `GEMINI_MODEL` | Gemini model name. |
| `backend/.env` (local only) | `DATABASE_URL` | SQLite database connection URL. |
| `backend/.env` (local only) | `CORS_ORIGINS` | Allowed frontend origins. |
| `backend/.env` (local only) | `GEE_PROJECT`, `SERVICE_ACCOUNT` | Reserved for future Earth Engine setup; no authentication is implemented. |

Never place backend credentials in a `VITE_` variable or commit a real `.env` file. The tracked `backend/.env.example` contains no Gemini key.

## Folder Structure

```text
backend/                 FastAPI application, routes, models, services, migrations
  api/                   REST routes and dependency wiring
  config/                Environment-based settings
  data/                  Local SQLite database (ignored)
  database/              SQLAlchemy database setup
  models/                ORM entities
  schemas/               Pydantic request and response models
  services/              Analysis, Gemini fallback, history, and report services
src/
  components/            Dashboard, landing, layout, and shared UI components
  hooks/                 React hooks
  lib/                   Query parsing, geocoding, mock datasets, and exports
  pages/                 Landing and dashboard routes
  services/              Frontend API clients
  types/                 Shared frontend types
public/                  Static public assets
```

## Screenshots

Screenshots can be added here before the hackathon submission, for example under `docs/screenshots/`.

## License

No license has been selected yet. Add the license approved by the project owners before public redistribution.

## Authors

PS-227 Smart India Hackathon 2026 project team. Add contributor names and affiliations before submission.
