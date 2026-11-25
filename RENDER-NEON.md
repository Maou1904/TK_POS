# Tingkum trial deployment: Render + Neon

## Architecture

- Frontend: Render Static Site (free), built from the `tk_frontend` repository.
- API: Render Web Service (`free`, Singapore), from `tk_backend`.
- Database: a new Neon Postgres database on the Free plan.
- Live services were created in the Render Dashboard using public repository URLs.
  Updating source requires a manual deploy in the Dashboard (no Git OAuth is linked).
- `render.yaml` is an optional recreation template, not the source of truth for the
  live Dashboard-managed services. Do not apply it alongside these live services
  without reviewing whether it would create duplicate resources.
- Source branch for both services: `codex/render-neon-trial`.

## Live deployment (2026-11-25, Asia/Bangkok)

| Resource | URL / identifier |
| --- | --- |
| Shop | https://tingkum-shop-trial.onrender.com/ |
| API health | https://tingkum-api-trial.onrender.com/health |
| API dashboard | https://dashboard.render.com/web/srv-dc363pfavr4c73eekrc0 |
| Shop dashboard | https://dashboard.render.com/static/srv-dc364grrjlhs73etjh6g |
| Neon project | `snowy-cherry-29959433` (`tingkum-trial`, Free, Singapore) |
| API commit | `193286295ba63cea3b316b1b9311889ea50e7a02` |
| Shop commit | `f02b9465dee59a8e3551d40c39339d4f277c4f69` |

Both Render deployments reached Live. This trial uses a new database with no
products or existing shop sales imported. The Render environment is named
Production by the platform; the application and database are trial resources.

The owner password was randomly generated locally and supplied as a private
environment variable. A private login note was saved outside all repositories.
No passwords or database connection strings belong in this document.

## Recreating the deployment

1. Create a Neon Free project for this trial. Choose Singapore if available, or
   the closest available region. Use a new database; no existing shop data is
   exported or overwritten by this setup.
2. Obtain the pooled Postgres connection URL from Neon with SSL enabled
   (`sslmode=require`). Keep this URL private.
3. Create a Render Blueprint from the `TK_POS` repository and the branch that
   contains `render.yaml`. Supply the Neon URL when prompted for `DATABASE_URL`.
4. Keep the API on the **Free** instance type and the frontend as a **Static
   Site**. No Render Postgres, paid disk, or paid instance is required.
5. Render generates `DEFAULT_OWNER_PASSWORD` privately. The first successful API
   startup creates the database tables, owner, and initial staff. The generated
   password only bootstraps a database without an owner; changing that environment
   variable later does not reset an existing owner's password.
6. The Blueprint passes the API's public HTTPS URL to the frontend at build time.
   If services are created individually instead, set `VITE_API_BASE_URL` to the
   actual API URL and rebuild the static site.

## Verified checks

- Local frontend build and lint passed; both backend JavaScript files passed syntax checks.
- Empty-database bootstrap and login session persistence after a backend restart
  passed against an isolated local PostgreSQL database.
- Public API `/health` returned HTTP 200 with `{"ok":true}` (includes a Neon query).
- New owner login and authenticated products, daily session, and staff APIs returned 200.
- Frontend `/` returned HTTP 200; the deployed JS contains the correct public HTTPS API URL.
- SPA fallback `/scan` returned the same index page as `/`.
- Browser owner login, POS, top-up, and stock screens loaded. Session survived reload.
- No browser console errors were observed during these checks.
- No live sale/cancellation or physical receipt-printer transaction was performed.

## Free-plan behavior

The Render API can sleep after 15 minutes without traffic. The first request after
sleep can take about a minute. Data belongs in Neon, not the API's local disk.
Render's free Postgres expires after 30 days, which is why this setup uses Neon.
Neon and Render both have free usage limits; keep both accounts on their Free
plans for this trial and inspect usage in their dashboards.

The scanner's pending events are stored in backend memory. An API restart or
sleep clears pending scanner events; database-backed sales remain in Postgres.

## References

- https://render.com/docs/free
- https://render.com/docs/blueprint-spec
- https://neon.com/pricing
- https://neon.com/docs/connect/connect-from-any-app
