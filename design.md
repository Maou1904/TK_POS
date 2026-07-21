# Tingkum POS Design

## Goal

Tingkum is a compact grocery-store POS for daily repeated use. The UI must work at 100% browser zoom on a normal laptop/desktop screen, keep the main actions visible, and separate money flows that should not be mixed.

## Layout Rules

- Use a dense dashboard layout, not a landing page.
- Root screen uses a left navigation rail, a compact top bar, and a scrollable page body.
- Standard font size is 16px. Large display numbers are reserved for payment totals only.
- Cards use 8px radius by default. Larger radii are only for primary action buttons.
- Tables and repeated rows must be scan-friendly with stable row heights.
- Each page owns its workflow. POS and Gas are separate sale flows and do not share cart state.
- Primary action stays near the transaction summary, not in a global footer.
- Avoid requiring browser zoom. Use responsive grids, smaller padding, and internal scrolling.

## Navigation

- POS: product scan, member lookup, cashier, payment, discount, receipt.
- Gas: gas order only, delivery details, driver, active jobs, daily history.
- Lottery: number entry, stock validation, lottery cart, payment.
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

## Gas Flow

Gas is separate from POS because cash handling and delivery tracking are different.

1. Choose cylinder type and operation: refill or borrow/new cylinder. Gas cards should include a clear product image.
2. Adjust quantity per cylinder type.
3. Enter customer name, phone, and delivery address.
4. Select driver.
5. Create job.
6. Review active jobs and today's completed/history list.
7. Return-empty-cylinder actions are handled from the pending tank/debt list, not from the new gas order cards.

## Lottery Flow

1. Enter lottery number.
2. Validate it against current stock.
3. Add available numbers to a lottery cart.
4. Allow quantity adjustment in the cart because one number can be sold as a set.
5. Take payment like POS, but use a separate cart.

## Stock Flow

1. Start from category cards, then show products for the selected category.
2. Show product table with current quantity, minimum quantity, and category.
3. Allow manual add/remove correction for mistakes.
4. Require a short reason for audit.
5. Keep adjustment log in a separate section.
6. Log section supports date filtering.

## Staff Flow

1. List active staff.
2. Add simple staff detail: name, phone, role.
3. Allow status toggle for inactive staff without deleting history.

## Visual Direction

- Use a calm operational palette: white, soft gray, muted rose as brand accent, green for success, amber for warnings, red for destructive actions.
- Use icons for navigation and action recognition.
- Keep Thai labels direct and short.
- Important totals use high contrast and fixed positioning within the summary panel.
