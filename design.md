# Tingkum POS Design

## Goal

Tingkum is a compact grocery-store POS for daily repeated use. The UI must work at 100% browser zoom on a normal laptop/desktop screen, keep the main actions visible, and separate money flows that should not be mixed.

## Layout Rules

- Use a dense dashboard layout, not a landing page.
- Root screen uses a left navigation rail, a compact top bar, and a scrollable page body.
- Standard font size is 16px. Large display numbers are reserved for payment totals only.
- Cards use 8px radius by default. Larger radii are only for primary action buttons.
- Tables and repeated rows must be scan-friendly with stable row heights.
- Each page owns its workflow. POS, Gas, Lottery, History, and Analytics share the same daily app session, but each sale flow keeps its own cart/job state.
- Primary action stays near the transaction summary, not in a global footer.
- Avoid requiring browser zoom. Use responsive grids, smaller padding, and internal scrolling.

## Navigation

- POS: product scan, member lookup, cashier, payment, discount, receipt.
- Gas: gas order only, delivery details, driver, active jobs, daily history.
- Lottery: number entry, stock validation, lottery cart, payment.
- Topup: mobile provider, phone keypad, amount, and fulfillment/payment tracking.
- Analytics: daily totals, top categories, staff performance, stock risk.
- Stock: product lookup, quantity corrections, adjustment log.
- Staff: staff list, active/inactive status, contact and role details.

## POS Flow

1. Scan or type barcode.
2. Lookup member by mobile number and show the remembered customer.
3. Select cashier.
4. Add products to cart from barcode/search only. Do not show a product browsing grid on the POS screen.
5. If the barcode is unknown, ask whether to cancel or register a new product. Registering adds the item to stock and immediately makes it sellable.
6. Accept cash now. Keep PromptPay visible as a future payment path, but do not make it the active default flow.
7. Enter cash received and manual bill discount.
8. Complete transaction and print receipt.

## Mobile POS Flow

Mobile POS is optimized for one-handed barcode work.

1. Mobile uses the same POS session as desktop. Only the layout changes.
2. Top section is the barcode scanner/input.
3. The scan button expands a camera panel from the top of the POS screen.
4. When mobile scans a barcode, the shared cart updates on mobile and desktop.
5. Middle and lower sections show only scanned cart items.
6. A sticky bottom overlay button opens checkout.
7. Checkout is a separate receipt-themed screen with totals, received cash, change, and a create-receipt button.
8. Receipt creation from mobile creates a print request in the daily session. A desktop POS client polls those requests and opens the browser print dialog on the computer that is connected to the receipt printer.

## Daily App Session

The app session is date-based: `TK-YYYYMMDD`. Every page uses this session id for that store day.

1. `app_sessions` stores the daily session and business date.
2. `sales_records` stores POS, Gas, and Lottery sales for History and Analytics.
3. `receipt_print_requests` stores pending receipt-print commands. Mobile can create a request, and desktop executes it.
4. POS cart tables, Gas job tables, and sale records all reference the same session id.

## Shared POS Cart

Desktop POS must support normal USB barcode scanners because they behave like a keyboard and submit the barcode with Enter.

Mobile and desktop share a cart through database-backed session tables:

1. `pos_cart_sessions` stores the active POS session code.
2. `pos_cart_items` stores the current cart rows for that session.
3. Desktop opens a POS URL with the daily app session code and shows a mobile POS URL for the same session.
4. Mobile opens that URL and renders the responsive POS layout, not a separate scanner page.
5. Any scan, quantity change, discount change, delete, or clear action writes to the shared cart API.
6. Each active POS client polls the shared cart API, so both screens show the same cart data.
7. If a barcode is unknown, the same register-new-product flow is shown.
8. Completing a POS sale writes the sale, decrements stock, clears the cart, and creates a desktop print request.

## Database And Permissions

Business data must be database-backed. Browser storage is allowed only for device/session convenience values such as `deviceId` and the visible daily session id.

1. `app_users` and `app_user_sessions` control login.
2. Roles are `owner` and `user`.
3. `user` can create operational records only: POS checkout, Gas order, Lottery checkout, and Topup order.
4. `user` cannot manage stock, create users, deactivate staff, cancel records, mark topup paid, mark gas paid, or receive returned gas tanks.
5. `owner` can manage users, staff, members, product stock, lottery stock, gas items, status changes, cancellations, and password resets.
6. Cancellations are soft deletes. They require a reason and keep the original record visible in history.
7. Any stock-affecting action writes `inventory_movements`. Cancellation reverses those movements so stock is restored.
8. `audit_logs` keeps create/update/delete/cancel history with actor, entity, reason, before data, and after data.

## Deployment

Deploy on Railway as two services. Because frontend and backend are separate Git repositories, connect each Railway service to its matching repository.

1. Backend service uses the backend repository and reads `DATABASE_URL` or database variables from Railway service variables.
2. Frontend service uses the frontend repository and serves the Vite build with `node server.js`.
3. Frontend must define `VITE_API_BASE_URL` as the public backend Railway URL.
4. Backend must listen on `process.env.PORT` because Railway injects the runtime port.

## Legacy Remote Barcode Scan

The older scanner-only page is not the target flow. It is replaced by the shared POS session model above.

Legacy remote scanning behavior was:

1. Desktop POS owns a scan session code.
2. Mobile opens a scanner URL with that session code.
3. Mobile sends detected barcodes to the backend scan session endpoint.
4. Desktop POS polls the session and adds incoming barcodes to the cart.
5. If a remote barcode is unknown, desktop shows the same register-new-product flow.

## Gas Flow

Gas is separate from POS because cash handling and delivery tracking are different.

1. Choose tank size only. Start with two active database items: 15 KG at 450 baht and 4 KG at 250 baht.
2. Adjust quantity per tank size.
3. Enter customer name, phone, delivery address or destination note, and delivery staff.
4. Set sale status before saving: returned empty-tank quantity and paid.
5. Delivery fee is added in the status/summary panel.
6. Confirm sale writes the gas job, sale record, payment status, returned-tank quantity, and delivery fee to the daily app session.
7. If only part of the empty tanks are returned, create a pending tank-return record for the remaining quantity.
8. Recent sales use a compact table with time, customer, size, status, and total.
9. Return-empty-cylinder actions are handled from the pending tank/debt list, not from the new gas order cards.

## Lottery Flow

1. Enter lottery number.
2. Validate it against current stock.
3. Add available numbers to a lottery cart.
4. Do not render a browse grid of every lottery number because real shop stock can be very large.
5. Allow quantity adjustment in the cart because one number can be sold as a set.
6. Take payment like POS, but use a separate cart.
7. Lottery stock is managed from Stock first with manual entry for number, quantity, and price.

## Stock Flow

1. Start from category cards, then show products for the selected category.
2. Show product table with current quantity, minimum quantity, and category.
3. Allow manual add/remove correction for mistakes.
4. Require a short reason for audit.
5. Keep adjustment log in a separate section.
6. Log section supports date filtering.
7. Include a separate Lottery stock section. For now it supports manual add/update by lottery number, quantity, and price.

## Mobile Topup Flow

1. Choose provider: AIS, TRUE, or DTAC.
2. Enter phone number by typing or using the on-screen keypad with 0-9, Del, and Confirm.
3. Choose amount from quick buttons or enter a custom amount.
4. Confirm the topup order and append it to the phone-number order table.
5. Each order has two independent switches: topped up and paid.
6. Keep this flow separate from POS until the real topup provider integration and accounting rules are finalized.

## Staff Flow

1. List active staff.
2. Add simple staff detail: name, phone, role.
3. Allow status toggle for inactive staff without deleting history.

## Visual Direction

- Use a calm operational palette: white, soft gray, muted rose as brand accent, green for success, amber for warnings, red for destructive actions.
- Use icons for navigation and action recognition.
- Keep Thai labels direct and short.
- Important totals use high contrast and fixed positioning within the summary panel.
- Gas sales should feel like a compact two-column operational dashboard: tank selection, recent sales, and pending follow-up on the left; delivery details and sale status on the right.
