# Railway Deployment

Deploy this project as two Railway services: one backend service and one frontend service.

Because `tk_backend` and `tk_frontend` are separate Git repositories, the preferred Railway setup is to connect each Railway service to its own GitHub repository. If you deploy from a wrapper repository that contains them as subdirectories, set the Root Directory as shown below.

## Services

### Backend service

- Repository: backend GitHub repository
- Root Directory: `/tk_backend` only when deploying from the wrapper repository
- Config file path: `/tk_backend/railway.json`
- Start command comes from `railway.json`: `npm start`
- Healthcheck: `/health`

Required variables:

- `DATABASE_URL`

Recommended Railway value:

- `DATABASE_URL=${{Postgres.DATABASE_URL}}`

Fallback variables:

- `DB_USER`
- `DB_HOST`
- `DB_NAME`
- `DB_PASSWORD`
- `DB_PORT`

The backend also supports Railway Postgres `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, and `PGDATABASE`.

### Frontend service

- Repository: frontend GitHub repository
- Root Directory: `/tk_frontend` only when deploying from the wrapper repository
- Config file path: `/tk_frontend/railway.json`
- Build command comes from `railway.json`: `npm run build`
- Start command comes from `railway.json`: `npm start`

Required variables:

- `VITE_API_BASE_URL`: public backend service URL, for example `https://tingkum-backend.up.railway.app`

## Deploy Order

1. Deploy the backend service and confirm `/health` returns `{ "ok": true }`.
2. Copy the backend public URL into the frontend service variable `VITE_API_BASE_URL`.
3. Deploy the frontend service.

## Local Behavior

Without `VITE_API_BASE_URL`, the frontend falls back to `http://localhost:5000`.
