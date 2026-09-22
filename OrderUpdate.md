# Order updates

## Workflow

1. A customer or admin submits an order. The order is `PENDING`, and its total is deducted from the customer's database credit balance in the same transaction that creates the order and clears the cart.
2. An admin opens `/admin/orders/[id]`, chooses any existing status, optionally writes a message, and submits the update. `ONHOLD` means rejected; no new `REJECTED` enum value was added.
3. An admin can also submit a message without changing the status. Messages are trimmed and limited to 2,000 characters. A status-only update is valid. An unchanged status with no message or refund does nothing.
4. The **Admin Only** checkbox hides that individual update from the customer. It does not hide the order's current status. It defaults to unchecked. Admins can see the entire history, with private entries labelled.
5. Customers see an unread-update count beside each order in `/orders`. `/orders/[id]` shows their visible history, newest first, and a badge for unread entries.
6. Once the detail history mounts in the browser, a server action marks the loaded visible update IDs as read. The badges disappear after acknowledgement. Merely listing or prefetching an order does not mark it read. Updates that arrive after the loaded snapshot remain unread until displayed. If acknowledgement fails, the history offers a retry button.

Updates apply to the whole `OrderBatch`. The existing optional `orderItemId` relation remains in the schema for compatibility but is not used by the new workflow. Customers cannot reply or edit updates. Updates are append-only through this interface.

## Credit and refunds

- Both customer and admin order submission now deduct credit. The amount uses the stored purchase prices (including the same rounding for single-eye purchases), cut fees (currently zero on creation), and delivery price. The deduction and order creation are atomic. A conditional balance update prevents spending more than the available credit.
- `OrderBatch.creditCharged` records the actual amount deducted. Refunds use this amount rather than recalculating from current product prices.
- When `ONHOLD` is selected, the admin detail form offers **Return credit**. It is unchecked by default. Rejection alone does not refund anything.
- An admin may refund during rejection or later, while the order remains `ONHOLD`, even without adding a message.
- The refund, order status, update entry, refund marker, and audit records commit together. A PostgreSQL row lock serializes updates to the same order, so simultaneous refund requests cannot both succeed.
- `creditRefundedAt` permanently records that the charge has been refunded. `OrderUpdate.creditRefunded` records the amount returned by that update. A second refund fails, including after subsequent status changes.
- Changing a refunded order to another status does **not** automatically deduct credit again. Recharging a refunded order is not part of this workflow.
- Existing orders receive `creditCharged = 0`. Their historical charges cannot be inferred reliably; automatic refunds are disabled for them. Zero-value orders also have nothing to refund.
- A private refund update remains private, although the resulting credit balance and current order status remain visible.
- Existing bulk status changes still work. They create public status-only updates, skip unchanged statuses, and do not refund credit. Use the detail form for messages, private notes, or refunds.

## Schema and migration

| Model | Field | Meaning |
| --- | --- | --- |
| `OrderBatch` | `creditCharged Int @default(0)` | Exact charge recorded at submission |
| `OrderBatch` | `creditRefundedAt DateTime?` | Once-only refund marker |
| `OrderUpdate` | `adminOnly Boolean @default(false)` | Hide this update from the customer |
| `OrderUpdate` | `readAt DateTime?` | Time the owning customer acknowledged the update |
| `OrderUpdate` | `creditRefunded Int @default(0)` | Credit returned by this update |

The index on `(orderBatchId, adminOnly, readAt)` supports unread counts and visibility queries.

Migration: `prisma/migrations/20260922120000_order_updates/migration.sql`.

Existing update records become public and unread, preserving their previous unrestricted visibility. No old update is deleted and no historical charge is invented.

The migration was applied to the local development database. For another environment, apply migrations and regenerate the client before running the updated application:

```sh
node node_modules/prisma/build/index.js migrate deploy
node node_modules/prisma/build/index.js generate
```

`lib/db.ts` now fingerprints the generated model/field names and Prisma client version. During development hot reload, a cached client with no fingerprint or an outdated fingerprint is disconnected and replaced. Matching clients are reused. Regenerating Prisma Client is still required after schema changes; restart the development server if generated modules have not reloaded or when making schema changes beyond model/field additions and removals.

### Fix: `Unknown argument creditCharged` on submission

The generated client already contained `creditCharged`, but the running development server retained an older `globalThis.prismaGlobal` instance. Its old cache check only tested for the `trafficVisit` model, which also existed on the stale client. As a result, it reused a client whose order input did not recognize the new field.

The model/field fingerprint check replaces that stale instance when `lib/db.ts` reloads, preserving connection reuse for compatible clients. No order or credit data is reset. A failed order creation rolls back the credit deduction because both operations run in the same transaction.

Regression test:

```sh
node --test tests/prisma-cache.test.mjs
```

This test verifies replacement of the old cache, replacement on fingerprint mismatch, reuse on a matching fingerprint, and a real nested `orderBatch.create()` with `creditCharged` and order items. The test order and its credit deduction are rolled back. The regression test and the existing eight order-update tests passed after this fix.

## Authorization and data handling

- Admin mutations authenticate and re-check the admin flag in the database. Input is validated server-side, including status, UUID, booleans, and message length.
- `/orders/[id]` now uses the customer query instead of the previous admin query and controls. The database query requires the authenticated user's ownership; another user's order returns not found.
- Customer detail queries exclude private updates in the database. List badges count only public, unread updates. Private messages are not sent to the customer browser.
- Read acknowledgement independently verifies ownership, order ID, explicit update IDs, public visibility, and unread state. It is idempotent and handles up to 500 IDs per request; the browser batches larger histories.
- Audit events include `ORDER_UPDATE_ADDED`, `ORDER_STATUS_CHANGED`, and `ORDER_CREDIT_REFUNDED`. Message bodies are not copied into audit logs.
- Relevant pages are revalidated after mutations. This does not push updates to another user's already-open browser; they see new updates when they navigate or refresh.
- New numeric formatting uses `.toLocaleString()` without `fa-IR`. History dates use the existing Jalali date formatter.

## Implementation map

- `lib/order-updates.ts`: input validation, transactional updates/refunds, read-acknowledgement filter.
- `lib/order-credit.ts`: shared charge operation and total calculation.
- `lib/actions/admin.orders.action.ts`: authorized admin mutations and complete history query.
- `lib/actions/orders.action.ts`: customer order queries, unread counts, and authorized read acknowledgement.
- `lib/actions/cart.actions.ts` and `lib/actions/admin.cart.actions.ts`: deduct and record credit at submission.
- `app/admin/orders/[id]/AdminSingleOrderItem.tsx`: admin message, status, visibility, and refund form.
- `components/OrderUpdateHistory.tsx`: history, visibility labels, unread badges, and browser acknowledgement.
- `app/(main)/orders/column.tsx`: per-order unread badge.
- `app/(main)/orders/[id]/`: customer-only detail page.
- `lib/order-status-farsi-map.ts`: `ONHOLD` is displayed as rejected.

## Verification

### Order submission notification fix

The Bale notification now runs after the order transaction commits. Previously it referenced the outer `orderBatch` inside the transaction callback, before that variable was initialized, causing submission to fail. It now uses the committed order's identifier, item count, and recorded `creditCharged` amount. The notification is awaited in its own `try/catch`, so a notification exception does not make a saved order appear to have failed. No live Bale message was sent during verification.

Run the integration suite against a migrated local/test database using the configured `DATABASE_URL`:

```sh
node --test tests/order-updates.test.mjs
```

It uses the installed `jiti` TypeScript loader and Prisma PostgreSQL adapter. Most fixtures are rolled back. The concurrency case commits isolated UUID-named fixtures and removes them in `finally`. It does not operate on existing customer records; database order-number sequences may advance.

The suite verifies charging and insufficient funds, message-only updates, private visibility, ownership and snapshot-safe read acknowledgement, rejection without refund, once-only refunds, legacy order handling, input validation, rollback, and simultaneous refund requests. All eight reported tests passed locally.

Prisma schema validation and ESLint on the changed application files and test runner passed. An earlier TypeScript check passed; the final full-project check reported `TS2307` in `app/(main)/page.tsx` for the missing `../baleSendNotification` import after unrelated workspace changes. The production build was attempted with and without sandbox restrictions; both attempts failed fetching the existing Noto Sans Arabic font from Google Fonts. Those homepage/font issues were not changed as part of this feature. Browser interaction checks below are a manual checklist, not an automated browser test result.

Manual UI checks:

1. Submit an order and verify the displayed balance drops by the stored total.
2. Post a public admin message. Verify the customer list badge, detail history, and badge removal after opening the order.
3. Post a private note, including a status change. Verify the admin sees the note, the customer sees the new current status, and the private note adds no customer badge.
4. Reject without refund, then refund from the detail form. Verify the balance changes exactly once and the refund checkbox becomes unavailable.
5. Try opening another customer's order and confirm it is inaccessible.
6. Verify existing bulk status updates remain usable.
