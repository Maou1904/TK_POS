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

## Lottery payment controls and manual draw reset (2026-11-26)

- Backend revision `683bec3cf941e584099acd590474e340811bdc05` deployed through
  `dep-dc3t8j95efls73cdkbi0`. Frontend revision
  `4baf78c240039252e191574bfc39eda84c599923` deployed through
  `dep-dc3t8ne1egvs73emkmgg`. Both were verified **Live** in Render on November 26.
  Public shop HTTP 200 and API `ok: true` checks passed; the served frontend asset
  is `/assets/index-DCFzvDp2.js`.
- Staff navigation is limited to POS, Gas, Lottery and Mobile Topup. Transfer
  records and analytics require owner permission on the API as well.
- The lottery approval queue survives business-date changes. Owners must enter
  actual counted cash; the submitter and approver remain separate evidence.
- Manual reset controls on Lottery/Stock review and clear only 00–99 inventory
  and unsubmitted carts. Sales history, pending approvals and existing six-digit
  stock remain. Old-generation cancellations cannot replenish a new draw.
- Isolated local DB tests cover role bypass, payment confirmation, pending totals,
  close guard, stale reset review, history/queue retention, old/current reversals,
  restart and concurrent checkout. Frontend mocked browser checks, build/lint,
  17 unit tests and existing gas/password checks passed.
- Local AI is a separate trial at `http://127.0.0.1:5012/`; the live Cloudflare
  provider and its environment remain unchanged per the user's latest direction.
  The PC trial was opened and visually checked; a real local extraction took
  0.59 seconds, compared with 0.9 ms for the rule parser on that sample.
- The authenticated live owner lottery page displayed the reset button and
  loaded its stock review from the deployed backend. The dialog was closed
  without selecting confirmation or applying the reset. Staff navigation and
  payment changes were validated with mocked browser and isolated DB tests.
- Detailed workflow: `LOTTERY-CONTROLS.md`. No live stock reset, payment approval
  or sale was performed during validation.

## Production PC gas AI relay live (2026-11-26)

- Backend `07f9a8ad0b984f364f17ff15bf748ee6bf0a6b83` replaces hosted-model calls
  with an outbound PC worker and a short-lived in-memory request queue. Final
  live rollout: `dep-dc3ueg5g1s2s73cpc890`. The activation rollout was
  `dep-dc3ucqd6e07s73dkjke0`.
- Frontend `a6d39fcd64466e648475ad8072ecc11b110cae7d`, deployment
  `dep-dc3tjj49v7es73d8bs30`, polls readiness and switches local AI/rules without
  reloading or clearing typed text. Served entry asset: `/assets/index-BOxiD1_g.js`.
- Following the user's scoped confirmation, Render now pins the PC public
  verification key (fingerprint `dccc2337ca4cf7e0`) with gas AI enabled. Removed
  `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` and the obsolete free-plan flag
  from the service environment. Database and owner settings were preserved.
- The PC identity private key stays in ignored, ACL-protected local runtime files.
  Only the public verification key is intended for Render. The worker identity
  is scoped to inference heartbeat/job/result endpoints and does not grant shop
  login, sales, inventory, account or database access.
- Windows current-user Startup launcher `Tingkum Gas AI.vbs` was installed and
  exercised. The worker started hidden, warmed Qwen3 4B on GPU, and duplicate
  launches retained one worker process. It connects to the HTTPS Render API and
  starts after this Windows user signs in; the PC must stay awake and online.
- Twelve relay/auth/validation tests, actual Ollama + worker loopback tests,
  frontend build/lint, 17 frontend unit tests, gas/lottery mocked browser checks
  and isolated password/lottery database checks passed. Real worker loopback
  round trips were 651 ms and 534 ms; this excludes production network latency.
  Tests covered abrupt worker loss, graceful stop, reconnection, late-result
  rejection and online/offline UI switching without reload.
- Live owner-page validation passed: the badge changed from rules to local AI
  without refresh; a named recipient and two sizes filled their separate counts;
  a place-only order filled both name/address as `ร้านป้าตุ้ม`; missing name/place
  stayed blank. The real worker regression test also covers all three cases.
- Stopping the actual worker changed the live page to rules while retaining the
  draft, and the rule parser filled an order. Restarting re-enabled AI without
  refresh. Inference succeeded again after the final backend deployment, and
  `/health` returned OK. Worker-reported production-job processing was about
  0.7 seconds for the initial samples; this is not full user-perceived latency.
- No live sale, payment approval or inventory change was performed. Synthetic
  form entries were cleared, leaving the live gas page ready with AI connected.
- Setup/operation: `tk_backend/LOCAL-GAS-AI.md`.

## Gas destination registration preserved (2026-11-26)

- Backend `cae5c8daecc9b1f3e63e456a1369f02ce0a4df08`, rollout
  `dep-dc3ui815efls73chj3gg`: local model instructions retain registration as a
  delivery detail. Validation restores an explicitly spoken registration when
  the model shortens an otherwise valid destination, without duplicating it.
- Frontend `9ad5c681c996fcec813b97a2743130948138af47`, rollout
  `dep-dc3uibff3r2c739os2lg`: rules recognize a standalone destination beginning
  with `ที่` and keep registration digits separate from counts and phone numbers.
- Regression: `ปตทถังใหญ่ 1 ถังที่ดอนปู่ตาทะเบียน 123` retains
  `ดอนปู่ตา ทะเบียน 123` in the destination. Tests cover Thai/alphanumeric plates,
  explicit customer names, a separate phone number, and no duplicate registration.
  Thirteen relay/validation tests, 15 parser tests, real Ollama/worker round trips,
  frontend build and lint passed. The PC worker was restarted with the new prompt.
- The existing live shop tab held an in-progress user order and was left intact.
  No sale or inventory modification was performed for this update.

## Compact gas voice panel and tracking tab (2026-11-26)

- Frontend `49c53734dce1c3a53bf622d4250229362abe6ff6` reduces voice entry to a
  compact microphone action, example, editable result and parser status. The
  apply/cancel controls appear when needed; microphone targets remain at least
  44 px high. Existing text extraction and stock checks remain in use.
  Render rollout `dep-dc3un8s9v7es73dbllag` reached Live; the existing shop draft
  was preserved rather than reloading the user's active page.
- Gas now has separate Sales and Tracking tabs. Tracking contains outstanding
  jobs/returns and today's recent orders. Switching retains the sales form and
  transcript, and cancels recording/inference so late results cannot change a
  hidden form. Arrow/Home/End keyboard navigation is supported.
- Build/lint and mocked browser checks passed, including voice events, errors,
  cancellation, stock checks, AI/rules switching, tab draft retention and late
  result cancellation. Screenshots were reviewed at 1024x768, 768x1024 and
  390x844; the idle voice panel is under 210 px on iPad and under 260 px on phone.
  No live sale was performed. Local screenshots: `artifacts/gas-compact/`.

## Distant gas delivery surcharge (2026-11-26)

- Backend `82f83683f006776ef89428254dd8a92ab3a19d7c` reached Live in rollout
  `dep-dc3ur2vf3r2c739pjipg` before releasing the updated frontend
  `0d675f8d684050e7b8d8e5f5aa8013bf9cc77fb2`.
  Frontend rollout `dep-dc3urfd6e07s73dlt9eg` also reached Live.
- The Gas delivery form has a `ส่งไกล` checkbox immediately below Paid. Selecting
  it adds 50 baht for each full cylinder being sold, across all selected sizes.
  Base delivery fees remain separate in the form. Unchecking removes the extra
  fee; a successfully submitted order resets the checkbox for the next order.
- The API computes the surcharge from validated item quantities, ignoring any
  client-supplied surcharge amount. Additive `gas_jobs.distant_delivery` and
  `distant_delivery_fee` columns preserve the selection and amount; old rows
  default to false/zero. `delivery_fee` includes base delivery plus the surcharge
  so existing closing totals reconcile, and the receipt note records the split.
- Isolated local DB checks cover single/multiple sizes, invalid quantities/fees,
  tampered surcharge amounts, persisted values after restart, closing totals and
  cancellation reversal. Mocked browser checks cover toggling, quantity changes,
  base fee edits, tab retention, request payload and reset after submission.
  Frontend build/lint passed, and checkbox placement was visually reviewed.
  No live order or payment was submitted for verification.

## Lottery cash keypad and electricity payments (2026-11-27)

- Backend `8471bfd83202efbcb0016a0c62290fb4f8a27b00` adds electricity payment
  records, a separate default service fee, cancellation/audit evidence, and its
  own closing confirmation. Existing transfers migrate with their original type.
- Frontend `caf65b4ca01537bdbe56b21e602eed9dffbf7825` adds a lottery cash
  popup with exact/100/200/500/1000 shortcuts, counted-cash owner approval, and
  a separate electricity entry page using the transfer workflow. The lottery
  draw reset control is now available only in Stock.
- Electricity bill amounts stay separate from fee revenue. Reports and exports
  label the service, and cancelled entries remain available for reconciliation.
- Local checks passed: frontend build/lint, simulated iPad/phone browser checks,
  isolated database migration, role and amount validation, idempotent retries,
  service isolation, repeated meter IDs, cancellation, closeout and restart.

- Backend rollout `dep-dc4oaddg1s2s73f7dbo0` and frontend rollout
  `dep-dc4oapou01pc73eprrp0` reached Live on November 27, around 20:27 and
  20:29 Bangkok time respectively. Served frontend asset: `/assets/index-dfx39kyk.js`.
- Public shop returned HTTP 200 and API health returned `ok: true`. The signed-in
  owner page loaded electricity records/settings from the real API. A temporary
  123.45 baht bill plus 20 baht fee showed a 143.45 baht total and 56.55 baht
  change from 200 baht; it was discarded without saving.
- The live lottery popup showed all five shortcuts and correctly calculated
  change. It was closed without confirming; the existing lottery cart was retained.
  The draw reset button was confirmed in Stock, and the electricity default-fee
  field was visible in Settings. No settings, payment approvals, sales or stock
  were changed during live verification. Browser error logs were empty.

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
