# Issues found while implementing todos.txt

## Fixed

- Admin invoice checks previously accepted any signed-in user. Several catalog/user/order actions and the order count stream had no admin check. They now check the database role.
- Cart read/delete trusted a supplied user ID, and cart updates did not check ownership. They now use the authenticated session.
- Credit requests used `WAITING_FOR_APPORVAL`, but approval/rejection matched `PENDING`. Review now uses the correct state and only reviews CREDIT invoices.
- Waiting credit invoices were labeled as paid. Their label now says awaiting credit approval.
- Payment code referenced a missing authority field, and there was no verification callback. Schema fields and verification were added.
- Admin date filters were not passed to queries; the other-orders tab used the wrong pagination key. Both are fixed.
- User orders always loaded page 1. Order totals excluded delivery/cutting charges. Both are fixed.
- Date parsing accepted impossible/reversed dates and depended on the server timezone. It now uses Tehran calendar days and rejects invalid inputs.
- Malformed user-filter JSON crashed pages. Filter changes now reset pagination.
- Order updates did not produce history records. They now create an OrderUpdate and audit entry transactionally.
- Order submission emitted events before commit through an unreliable global reference. It now emits through the imported emitter after commit.
- Header credit came from a stale JWT. It now reads the current balance.
- Product/lens writes were separate operations. Catalog mutations and their audit entries now run in transactions.
- Existing TypeScript errors in tag color imports, an unused category editor call and the legacy category creation component were fixed.
- Admin invoice navigation pointed at the user page; it now points at `/admin/invoices`.

## Remaining limitations / decisions needed

- Production build currently requires Google Fonts downloads. The build attempt failed on network access to those fonts; TypeScript checks passed. Self-host fonts or build with font access.
- **Migration history is stale.** The August SQL migrations describe old order statuses and an Invoice model with `invoiceCode`; the pre-task schema already used different columns. The new additive migration assumes a database matching the pre-task schema. Do not run the complete migration history on a new database expecting the current schema. Reconcile/baseline existing environments first; see changes.md.
- **Payment gateway integration is not live-tested.** The existing ZarinPal wrapper and Rial conversion were retained. Gateway credentials, API host, sandbox compatibility and amount units must be checked with the merchant's current integration documentation. Official documentation was inaccessible during this session.
- Payment retry reuses the persisted authority to avoid overwriting an in-flight payment. Expired authorities need a separate payment-attempt/reconciliation workflow before production; there is no automatic authority rotation.
- Old PAID invoices have no trustworthy payment timestamp. They remain visible in invoices but are excluded from the new paidAt-based financial chart. No historical timestamps were fabricated.
- CREDIT approval retains the existing meaning: it grants balance and marks the request PAID. A credit repayment/debt ledger and due-date management are not implemented; financial reports keep credit grants separate from cash receipts.
- Existing order submission does not debit credit, and delivery pricing is still supplied by the caller (now validated as a nonnegative integer). A business rule for debit timing, delivery tariffs and cutting prices is still needed. Cutting price remains the existing zero-at-submission placeholder.
- Cart prescription/product availability validation remains limited; no new stock or prescription rules were invented.
- The order event emitter is process-local. Multiple production instances need shared messaging/polling for consistent live counts.
- Existing tags Edit/Delete controls remain placeholders. They are unrelated to the requested workflows.
- Audit logs cover successful account/authentication/cart/catalog/order/invoice/ticket changes. They do not capture page views, failed logins, or direct database edits. Retention/export and tamper-resistant storage are not implemented.
