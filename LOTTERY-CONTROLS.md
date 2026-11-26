# Lottery payment approval and manual draw rollover

Ordinary users see four navigation entries: POS, Gas, Lottery and Mobile Topup.
Transfer records and analytics APIs require owner permission. Owners retain the
management screens.

Staff lottery checkout reserves stock and creates a pending order. It cannot set
confirmed cash, approval identity or completed status, even if those fields are
included in the request. Pending orders are excluded from revenue/closing totals
and block closing their business day. Owners enter cash they actually counted,
then confirm payment. The submitter and approver are recorded independently.
The owner cash field starts empty, rather than copying the staff-reported amount.

Pending lottery orders are polled across business dates. Staff see their own
pending orders; owners see the full queue. Confirm/cancel actions use the order's
original business session.

## Manual draw change

Owner controls on Lottery and Stock open a review dialog. It shows remaining
00–99 stock and the number of pending approvals, requires a reason and explicit
confirmation, and checks that stock has not changed since review. There is no
automatic date-based clearing.

The operation clears only 00–99 stock and unsubmitted cart lines for those
numbers. Existing six-digit stock is outside this control. Sales history and
pending orders remain. Each ticket receives a new stock generation; cancellation
of an earlier generation cannot restore old tickets into new stock. Current-draw
cancellation still restores stock. Zero-stock draw changes also advance the
generation so later old cancellations remain separate.

Stock changes, checkout and reset share a transaction lock. The additive migration
adds `lottery_tickets.stock_generation` and `inventory_movements.lottery_generation`
with zero defaults for legacy rows. Stock-reference backfill includes only the
current generation, preserving a cleared board after restart. Reset history and
removed quantities remain in audit/inventory movements.

## Validation

- `node scripts/test-lottery-controls.cjs` in `tk_backend`: isolated random local
  database only; role bypass, pending totals/close, stock snapshot conflicts,
  history/queue retention, actual cash approval, old/current-draw reversals,
  restart and concurrent checkout.
- Existing password and gas-brand isolated DB checks passed; provider tests and
  17 frontend unit tests passed.
- Frontend build/lint passed. Mocked browser tests verify the four staff menus,
  staff submission, owner cash entry, reset confirmation/stale review, and existing
  gas speech/AI flows. Mocked tests never create a production sale or clear real stock.

Local AI experimentation is separate at `experiments/gas-local/`. The live gas
provider remains Cloudflare, following the user's direction to test on the PC
before deciding to switch.
