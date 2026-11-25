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
| API commit | `7979d84558b3e1a7daa11a151c671c661d83101b` |
| Shop commit | `34539361ee9e7629dad49817b2294196f27e12cb` |

The initial Render deployments reached Live. This trial uses a new database with
no existing shop sales imported. The Render environment is named
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

## Gas brand update (2026-11-25)

- Gas stock now has its own `brand` field. Owners select Siam or PTT when adding
  cylinders, and can assign the brand of an existing row in the stock table.
- Sales only display the chosen brand's cylinders. Switching brands clears the
  previous selection; the API also rejects mixed or mismatched brand orders.
- Legacy rows are classified only when their existing ID/name/operation identifies
  exactly one brand. Shared or ambiguous stock remains unassigned for owner review.
- Gas job IDs now include a random suffix so consecutive orders do not collide.
- `node scripts/test-gas-brands.cjs` in the backend uses a disposable local database
  to test migration, brand validation, mixed-order rollback, overselling, separate
  full/empty stock for both brands, cancellation, and persistence after restart.
- The live trial has 10 full Siam 15 kg cylinders and 10 full PTT 15 kg cylinders,
  both at the user-approved trial price of 500 baht. PTT's existing stock and image
  were preserved; Siam stock was received through the authenticated stock API.
- Both updated deployments reached Live. Browser checks confirmed each brand
  shows only its own cylinder, each has 10 full/0 empty, switching brands clears
  the previous selection, and both saved brands appear in the stock table.
- The add-stock form exposes the brand selector. No browser console errors were
  observed during these checks. Live verification did not create sales; stock
  deduction and reversal were exercised in the isolated local test database.

## Transfer dashboard update (2026-11-25)

- Analytics now returns transfer records for the selected Bangkok day/month/year,
  separately from sales. Cancelled transfers remain visible for reconciliation.
- The overview, trend, categories, payment summary and staff totals include only
  non-cancelled transfer fees. Transfer principal is displayed separately.
- The transfer panel shows principal, fees, count, net cash, cash received, change,
  and cancellation count; its detail table retains all entries in the period.
- Sales average excludes cancelled bills. Transfer fees do not enter product item
  counts or sales-only averages.
- Excel now includes a Transfers worksheet and separate principal/fee/cash lines
  in Summary. No tax calculation or tax-invoice behavior was changed.
- Verified local API boundary/cancellation tests, frontend monetary/timezone tests,
  build and lint. Both deployments reached Live. Checked the real day/month/year
  dashboard and reconciled its amounts against the existing transfer screen.
- Downloaded the real XLS and parsed all four worksheets; transfer detail totals
  match Summary and its combined total equals sales plus fees, without principal.

## Gas voice, account and lottery controls update (2026-11-25)

- Both repositories were pushed on `codex/render-neon-trial` and manually deployed
  through the existing Render services. API deploy `dep-dc3elkp5efls73bmnhhg` and
  shop deploy `dep-dc3elpvavr4c73f6dbn0` both reached **Deploy succeeded | Live**
  at approximately 21:04 and 21:05 Asia/Bangkok, respectively.
- The gas page accepts one spoken order through browser speech recognition in
  Thai, then fills brand, cylinder size, quantity and delivery details for review.
  Matching uses actual brand-specific inventory, and ambiguous or unavailable
  products leave the form unchanged. No SLM service or API key is required.
- Account settings expose self-service password changes and owner password resets.
  Resetting a password revokes old target sessions; an owner's own current session
  is retained. Passwords are not exposed in API responses or audit logs.
- The lottery stock map uses each number's reference stock for its color level.
  Staff lottery sales reserve stock and await owner payment approval before they
  count in closing totals. Pending approvals block shop closing.
- Local build, lint, 12 frontend tests, mocked gas voice browser checks, and
  isolated local password and gas-brand API tests passed before publication.
- Live `/` and API `/health` returned HTTP 200, with health reporting `ok: true`.
  The deployed `index-D2QRB3uF.js` contains the gas voice controls, Thai speech
  configuration, account controls and lottery approval UI.
- Real microphone recognition on the shop iPad remains to be tested. Live
  verification did not create a sale or change a password.

## Multiple gas sizes and delivery phrases update (2026-11-25)

- Frontend commit `7a95801afac334133257050bb223e197c407a113` reached
  **Deploy succeeded | Live** in deploy `dep-dc3etvom7kps73e35vj0` at about
  21:22 Asia/Bangkok. No backend change was required for this update.
- One command can select multiple sizes of the same brand, including separate
  quantities and shared counts such as "อย่างละ 2 ถัง". All sizes are checked
  before any form values change, so a missing or insufficient size rejects the
  entire proposed order rather than filling only part of it.
- A destination without a separate name fills both customer label and address.
  If a new product command has neither, both stay blank instead of inheriting
  the previous customer's details. Explicit names take priority.
- Recipient phrases such as "ให้คุณเจเจที่ดอนภูตา" now separate the name and
  destination. Local build, lint, 17 frontend tests and mocked browser checks
  passed, covering multi-size quantities, stock rejection and these name rules.
- Live HTTP and served-asset checks confirmed the updated frontend. This is
  still the browser speech and rule-based parser; no external language-model
  provider has been connected or customer text sent to an AI inference API.

## Cloudflare AI activated and verified (2026-11-25)

- API commit `7979d84558b3e1a7daa11a151c671c661d83101b` and frontend commit
  `34539361ee9e7629dad49817b2294196f27e12cb` both reached Live in deployments
  `dep-dc3f3k68bjmc73fh35v0` and `dep-dc3f3pnlot8c73a04hb0`, respectively.
- The authenticated gas voice endpoints can call Cloudflare Workers AI for
  structured order extraction. The frontend shows AI only when enabled, can
  cancel pending interpretation, and falls back to the local parser on errors
  or quota exhaustion. Drafts still require stock validation and human submission.
- After user approval, the account ID, scoped API token, `GAS_VOICE_AI_ENABLED`
  and `GAS_VOICE_AI_FREE_PLAN_CONFIRMED` were set in the existing Render API
  service. No API token is stored in source or frontend build variables.
- The Cloudflare account's Workers plans page was inspected: **Free** was marked
  **Current plan**, including 10,000 Workers AI neurons per day. The token named
  **Tingkum gas voice** grants only Workers AI Read/Edit for that account.
  No paid plan, credits or billing upgrade was selected.
- Backend provider tests use fake credentials and mocked inference; authentication
  checks passed against an isolated local database. Frontend build, lint and mocked
  browser tests passed for AI responses, quota fallback, clarification and cancellation.
- Backend commit `37566547a8e1097b2eb75b8cd7b84f589f17d3ca` reached Live in
  `dep-dc3g3567bikc73d33h00` at about 22:42 Bangkok. This adds failure diagnostics
  containing only status, numeric provider codes and timing; never order text,
  model output or credentials. All 10 provider tests passed.
- The live authenticated gas page displayed **AI**. Real inference with
  `@cf/qwen/qwen3.8-27b` populated the form from the user's example:
  `ส่งปตทถังใหญ่ 1 ถังให้คุณเจเจที่ดอนภูตา` became PTT 15 kg x 1,
  customer `คุณเจเจ`, destination `ดอนภูตา`.
- Live tests also verified that destination-only `หลังวัด` fills both identity
  fields, and omitted name/destination clears both. A multi-size 15 kg + 4 kg
  request was rejected atomically because the live inventory has no PTT 4 kg
  product. Adding an actual 4 kg product and its price remains a shop stock setup
  task; no products or prices were invented for the test.
- The first inference was unavailable and visibly fell back to the local parser;
  subsequent real requests succeeded. The initial cause was not established.
  No gas sale was submitted, and the live form was cleared after testing.
- Public health returned `ok: true`; the voice status endpoint rejects
  unauthenticated requests with HTTP 401. Speech-to-text still uses the browser's
  speech service; live model tests entered synthetic text into the voice text box.

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
