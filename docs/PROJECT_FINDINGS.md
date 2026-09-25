# Bugs and design findings

Originally reviewed 2026-09-24; F-01?F-18 implementation updated 2026-09-25. The items below describe the fixes now in source. Deployment requires the new migration and configuration described in [deployment notes](hardening-deployment.md). Unit/action tests use mocks; they do not prove live database concurrency, gateway operation, hosting limits or browser behavior. No live payments/messages or database migrations were initiated.

## Implemented fixes through F-18

### F-01 ? Server order eligibility ? fixed

`lib/lens-policy.ts` is shared by customer/admin additions and both checkout actions. The server reads current verification state and product activity/type/ranges, validates finite quarter-step powers and axis 0?180, and rechecks existing cart items at checkout. Invalid accounts/products/prescriptions fail before debit/order writes. Checkout remains Serializable. Tests directly invoke both action families, including products disabled after addition.

### F-02 ? Profile password disclosure ? fixed

Profile submission returns only success or a safe error, never a User record. Its conditional `updateMany` does not retrieve password hashes. Tests assert the minimal return shape.

### F-03 ? OD/OS eligibility ? fixed

`lensEligible` enforces `odValid && (odOnly || osValid)` for the component and server. The duplicate category calculation delegates to it. Truth-table tests cover all eye-validity/single-eye combinations, malformed values and invalid axes.

### F-04 ? Privileged bot action boundary ? fixed

`lib/actions/bale.actions.ts` is removed. `lib/bale.ts` imports `server-only` and is not a Server Action. Authorized business actions construct bounded notifications; public signup sends only after its validated transaction commits. No arbitrary bot transport is exported as an action.

### F-05 ? Profile validation/state/audit ? fixed

Only UNVERIFIED/REJECTED accounts can submit. A conditional state update and audit share one transaction. Server validation requires ten ASCII digits, a trimmed 2?100-character management name and 5?1000-character address. Waiting/verified states and malformed/oversized fields are covered by action tests.

### F-06 ? Single-eye pricing ? fixed

`lensPrice` rounds a half-price to an integer Toman in product cards, cart rows, preview totals and both checkout actions. Tests charge two odd-priced single-eye rows at the exact rounded balance.

### F-07 ? Catalog validation/create contract ? fixed

Shared strict Zod schemas bound names/descriptions, booleans, integer prices, UUIDs, tags, enum values and ordered quarter-step ranges. Create persists `active`; update parses an explicit allowlist and verifies category/type and lens consistency using current state. Non-lens products do not retain lens relations. Forms use the shared schema. Direct-action tests cover false activity and invalid schemas.

### F-08 ? Product deletion relationship ? fixed

The legacy lens-ID argument is ignored. The server reads the target product's lens and deletes by productId. Products referenced by carts/orders are archived (`active=false`); unreferenced products and their own lens are deleted transactionally. Tests pass an unrelated lens ID and check archival behavior.

### F-09 ? Route invalidation ? fixed

Master-category mutations invalidate `/admin/master-category` after commit, along with related category/product option loaders. Invalid `/admin/summary` targets now point to `/admin`. Product/category mutations invalidate builder consumers after commit. An action test verifies commit precedes invalidation. Open-browser counts use independent polling (F-13).

### F-10 ? Settings/billing policy ? fixed by explicit policy

User-approved policy: delivery stays in the once-per-user/day fee workflow; checkout rejects any nonzero caller delivery fee. Cutting charges remain zero/disabled rather than silently activating stored prices. Settings copy explains both rules. Bale uses the stored group ID with environment fallback. Telegram remains clearly labeled inactive. Tests reject delivery tampering in both checkout actions.

### F-11 ? Production-safe mutation failures ? fixed

Mutation boundaries return serializable `{success:false,error}` through `actionResult` or explicit result handling. Known business failures use `ExpectedError`; Zod failures return safe validation text; unexpected details stay in server logs. Client callers check results, including shared/conditional action handlers. Legacy query exceptions remain query exceptions; `ActionError` no longer claims its message survives production. JSON round-trip tests cover readable expected errors and no DB-detail disclosure. An invalid-signup HTTP request against the production server returned its safe failure/fieldErrors payload. Authenticated browser workflows still require deployment testing.

### F-12 ? Notification observation/commit ordering ? fixed

Signup notification occurs after commit. Profile/invoice/ticket/order callers await the transport. The transport checks HTTP and API success, bounds text, uses an eight-second timeout, and observes/logs failure without reversing a committed operation. Ticket notifications use username. Tests cover API failure, rollback and post-commit delivery. Delivery is explicitly best effort; no durable outbox/retry guarantee is claimed.

### F-13 ? Order-count recovery ? fixed with polling

The retained `/api/orders/order-stream` URL now returns authorized, no-store JSON from the shared database. AdminProviders polls every 15 seconds and cancels requests/timers on unmount. This recovers across workers, status changes and reconnects. Count changes no longer produce misleading new-order toasts. Tests verify independent DB reads and access denial. Full tables still require refresh.

### F-14 ? Unbounded list/report loading ? fixed for identified loaders

Admin product/user lists paginate. Order items, updates and ticket messages paginate at 50 per page; independent aggregates keep full order totals/lens counts correct. Daily queries page 20 whole user groups and constrain fee receipts to those users; local filters apply to the displayed page. Admin orders loads only its active tab. Financial data is aggregated in SQL by Tehran hour/day before Jalali bucketing. User audit filtering uses database subqueries and a bounded page, rather than transferring all related IDs. Complete per-user daily groups can still be large; representative production query-plan/latency profiling remains an operational check.

### F-15 ? Payment lifecycle/recovery ? fixed

PaymentAttempt stores authority history/check timestamps. A 15-minute local reuse window triggers provider inquiry; age alone never proves expiry. Only a provider-reported FAILED attempt is replaced; unknown/active states stay blocked from replacement. Requests serialize per invoice. Callback reconciliation is server-only and session-independent; provider verification, not browser Status, proves payment. Owner retry/reconciliation is available. Configuration is explicit with no placeholder merchant/default mode; HTTP calls time out. Verified receipts persist before bounded, idempotent credit application, so a full balance leaves a visible pending-credit receipt that can be reconciled later. Existing paid invoices are backfilled as already credited. See [payment recovery](payment-recovery.md) for provider references and limitations. Tests use gateway/DB mocks, including concurrent retries and balance overflow.

### F-16 ? Refund/history policy ? fixed

User-approved policy forbids reopening a refunded order; a new order must be charged instead. Refund increments check balance headroom atomically. New order items snapshot product name, category/color and packaging flags in addition to existing prices/guarantee data; detail loaders restore snapshots. Legacy null snapshots explicitly retain live-catalog fallback rather than inventing history. CREDIT PAID is a balance grant, not cash receipts, and daily fees remain outside original refundable totals.

### F-17 ? Private uploads, quota and cleanup ? fixed

ImageAsset records ownership/size. GET requires owner/admin and uses private no-store caching. Upload quota is 100 assets/100 MiB per account, checked under a user lock, plus an operation rate limit. Form replacement/removal deletes files and metadata; `/profile/uploads` lets owners remove abandoned uploads. A dry-run-first orphan cleanup script handles old files with no metadata. Production upload requires explicit persistent storage configuration; multiple instances must mount the same storage. Legacy files without ownership metadata are denied until explicitly mapped. Sharp's validation/metadata stripping remains unchanged. See [image uploads](image-uploads.md).

### F-18 ? Application rate limits ? fixed

Atomic PostgreSQL fixed-window counters cover login IP/account (before scrypt), signup, uploads, analytics, ticket creation/replies and payment operations/callbacks. Keys hash identities; expired windows are removed. `RATE_LIMIT_IP_HEADER` must name a header overwritten by a trusted proxy; without it, anonymous operations conservatively share one bucket. Tests verify thresholds and upload gates. Infrastructure/WAF protections were not inspected and are not assumed. See [deployment notes](hardening-deployment.md) for limits.

## Lower priority / maintainability

### F-19 — Visible controls and helpers are unfinished or disconnected

**Confirmed.** Tags column renders literal Edit/Delete without handlers. AdminCreateUserBtn opens an empty dialog. AdminOrderDataTableWrapper has a bulk implementation but no caller; live pending/rest tables do not enable it. `GetProductCategoryItems(id)` queries Product.id rather than categoryId; no caller was found, so this is a latent helper defect rather than a reproduced screen failure.

**Verify/fix:** complete or remove placeholders and clarify helper contracts. Wire bulk operations only after stable selection behavior is addressed.

### F-20 — Table selection uses positional identity

**Confirmed component risk.** DataTable omits getRowId, so TanStack defaults to index IDs. Selection/status can attach to a different record when props reorder or refresh. Pending status timers are not explicitly cleaned up; trigger relies on caller UI to prevent concurrent invocation. Bulk wrapper is currently unmounted, reducing active exposure.

**Verify/fix:** require stable record IDs for selectable tables, reset/reconcile selection after data changes, guard pending work, and test reorder/delete/refresh during selection.

### F-21 — Form/UI details are inconsistent

**Confirmed source observations; accessibility effects need browser testing.** Combobox shorthand accepts emptySnapValue but never consumes it; null selection is ignored. Shorthand IDs are derived only from field name, allowing collisions if multiple forms with the same field are mounted. Select/combobox have custom next-focus logic. Some inclusion checkboxes have adjacent text/icons without associated labels. SubmitOrderBtn duplicate failure toasts were fixed alongside F-11. Some toast types are uppercase, so icons are missing. Tabs accepts arbitrary URL values and can select no matching panel.

**Verify/fix:** remove or implement unused props, use per-instance IDs, label controls, test keyboard/focus in dialogs and repeated forms, normalize toasts and validate tab keys.

### F-22 — Tooling and setup documentation gaps

**Partially addressed during F-01?F-18 work.** Test/typecheck scripts, intentional CJS lint configuration and environment names are now present. Current checks and build notes are in [deployment notes](hardening-deployment.md). Remaining F-22 work includes existing unused declarations, the nonexistent `app/admin/users/columns.txs` tsconfig entry, and PrismaAdapter's missing OAuth/database-session model set. Credentials/JWT use does not validate future auth modes.

**Remaining verification:** review adapter/schema before expanding authentication; add CI/disposable PostgreSQL concurrency and migration replay checks, and clean remaining tooling warnings.

## Documentation cleanup performed

- Removed obsolete `bugs.md`: mixed fixed history with now-false no-credit-debit and migration claims.
- Removed obsolete `changes.md`: referenced absent summary route, migration and test files, and an outdated fixed 14-day financial report.
- Removed obsolete `OrderUpdate.md`: useful behavior moved to the guide; missing integration-test commands and old build/type-check claims were discarded.
- Replaced starter README with current documentation links and commands.
- Retained `doc/order-management.md` and `docs/image-uploads.md`, which still describe current feature contracts. Retained `todos.txt` as historical requirements, not current implementation documentation.

Original review results are historical. Current verification and remaining deployment checks are recorded in [hardening deployment notes](hardening-deployment.md).
