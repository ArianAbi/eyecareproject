# Improvement suggestions

Reviewed 2026-09-24. These are proposals, not implemented changes. Keep the existing admin structure unless a specific improvement requires changing it. References such as F-01 point to [findings](PROJECT_FINDINGS.md); current architecture is in [the guide](PROJECT_GUIDE.md).

## 1. First: make browser and server rules agree

| Proposal | Why / related findings | Completion criteria |
| --- | --- | --- |
| Shared order eligibility service | Customer/admin validation diverges; prescription UI has logic bugs (F-01, F-03) | Both actions validate account, product/type/activity and prescription bounds; checkout rechecks current data; tests exercise bypasses and OD/OS combinations |
| Minimal profile response and complete schema | Full User return exposes hash; UI state rules can be bypassed (F-02, F-05) | No password in responses; allowed state and bounded fields enforced/audited server-side |
| Server-only integration module | Bot transport should not be a public action boundary (F-04) | Only business actions exposed; messages constructed from validated inputs; integration failures mocked |
| Shared integer pricing | Preview differs from charge (F-06, F-10) | A single pricing helper covers single-eye rounding; delivery/cut policy documented and authoritative on server |
| Complete catalog action schemas | Form constraints are not runtime guarantees (F-07, F-08) | Unknown inputs excluded; relationships checked; active persisted correctly; referenced-product deletion policy explicit |

These changes can keep the existing pages, forms and actions folders. Prefer extracting small domain functions used by both action families to duplicating a second checkout implementation.

## 2. Standardize mutation contracts incrementally

For new/edited actions, use a typed discriminated result such as `{success:true,data}` or `{success:false,error,fieldErrors?}` for expected validation/business failures. Keep unexpected exceptions logged server-side with a correlation ID. Map errors into RHF fields where possible and one form-level toast otherwise. Avoid a sweeping rewrite solely for naming consistency. See F-11.

Adopt a consistent mutation sequence: authenticate, parse, authorize ownership/current state, transact business writes plus audit, commit, invalidate actual routes, then perform observed side effects. Preserve compare-and-swap updates, row locks and idempotency guards already protecting balances/refunds/fees.

Completion criteria: failed validation is readable in production mode; no sensitive DB errors return to clients; mutation rollback leaves no audit/side-effect claims of success; list/detail/sidebar refresh correctly (F-09, F-12).

## 3. Make the admin easier to extend

- Extract one ProductForm with create/edit initial values and callbacks, backed by one shared schema. Keep separate route pages as loaders. Preserve current field shorthand and Base UI composition instead of adding another form library.
- Use one typed navigation configuration from which sections/menu groups are derived, or validate that every menu group appears in a section. Keep current shell appearance and provider interfaces.
- Extend DataTable with stable getRowId and deliberate selection-reset behavior. Add pagination/sorting options explicitly rather than assuming TanStack enables them. Then decide whether to wire the existing bulk wrapper (F-20).
- Finish or hide tag edit/delete and empty create-user controls. Treat dialog create/edit, full-page editing, filters and tables as documented recipes (F-19).
- Centralize safe display helpers for money, counts, Tehran/Jalali dates and status labels. Preserve technical prescription signs and intentional LTR inputs.
- Consolidate unused/duplicate helpers only after checking imports: alternate providers/themes, duplicated category update helpers, old table wrappers and commented code are candidates, not automatic deletions.

Completion criteria: one sample new admin entity can reuse the shell, fields, actions, filters and list without modifying generic UI internals or duplicating feature-independent plumbing.

## 4. Clarify financial policy before expanding reporting

Decide whether delivery belongs to each order or once per user/day; define cut pricing, refund reopening and manual adjustment rules. Do not silently activate stored prices: that changes billing. Label financial charts as cash receipts/credit grants, not revenue/profit (F-10, F-16).

Consider a dedicated append-only balance ledger with signed amount, reason, actor, linked business record, timestamp and unique idempotency key. Keep balance updates and entries atomic. Move daily-fee duplicate protection from generic audit-log IDs to an explicit durable charge/ledger record before introducing audit retention. Do not invent legacy transactions to make totals appear reconciled.

Completion criteria: reconciliation explains every new balance movement; repeated approval/callback/refund/fee requests cannot double-apply; concurrent withdrawals cannot overspend; legacy differences are explicitly recorded rather than fabricated.

## 5. Strengthen integration lifecycles

- Payment attempts: record provider authority/status/expiry and link attempts to invoice. Define recovery for expired authority, lost browser session, callback retries and external success followed by local failure. Validate current provider docs before implementing; exercise only a designated sandbox (F-15).
- Messaging: use post-commit delivery with checked HTTP/API result and timeout; add an outbox if reliable retries matter. Avoid retrying with duplicate customer-facing messages. Connect group settings intentionally (F-04, F-12).
- Live counts: use typed events for new order/status change, add heartbeat/reconnect handling and shared pub/sub or polling if deploying multiple processes. Refresh other badges intentionally rather than implying all are real-time (F-13).
- Images: choose public catalog assets versus private attachments. Add ownership/reference metadata, quotas and orphan cleanup; use persistent/shared storage. Keep Sharp validation, metadata stripping and limits (F-17).
- Rate limits: check existing hosting protections first, then constrain expensive login/signup/upload and unauthenticated analytics entry points without breaking ordinary workflows (F-18).

Completion criteria: timeouts/failed responses/duplicates are tested with mocks; a committed business transaction is not reported as failed solely because its notification failed; deployment behavior is documented.

## 6. Improve performance based on measured data

Add server pagination to main product/user lists, and query only fields displayed. Move large financial aggregations toward database grouping. Avoid fetching every related record ID for user audit filtering; consider explicit subjectUserId or a queryable relation if that becomes a bottleneck. Load expensive tab contents according to active tab when possible (F-14).

Preserve whole-user grouping in daily orders. If a day's result grows too large, paginate user groups or load expanded details on demand rather than splitting a user's orders unpredictably. Add stable tie-breaker ordering for paginated queries.

Completion criteria: measure query count, transferred row count and latency on representative data before/after; add indexes based on actual query plans. Avoid adding cross-user caches or broad invalidation wrappers merely to hide expensive queries.

## 7. Improve form and mobile usability

Use unique IDs and associated labels for repeated forms and inclusion controls. Review custom focus jumps with keyboard/screen-reader testing. Normalize toast casing and avoid duplicate failure messages. Handle invalid URL tabs with a default, and use notFound for missing product records. Implement or remove emptySnapValue rather than advertising unused behavior (F-21).

Test actual RTL layouts at narrow/mobile widths, long Persian names, empty lists, validation errors and dialog/sheet focus return. If Persian digits should be accepted in numeric fields, normalize them deliberately before validation instead of assuming inputMode performs conversion.

Completion criteria: all controls have names, predictable keyboard access and visible pending/error state; numeric previews equal saved values; filters preserve unrelated URL state and reset the correct page keys.

## 8. Establish reproducible checks and setup

Fix the current lint configuration for CJS harnesses, remove unused declarations and the columns.txs typo, and add `test`/`typecheck` scripts. Complete env.example with gateway/storage names, no secrets. Add CI for existing tests, types, lint and production build; consider local fonts for predictable builds (F-22).

Add meaningful tests for the uncovered rules first: eligibility, OD/OS ranges, rounded totals, profile return shape, authorization, payment idempotency and refunded-state transitions. Add disposable PostgreSQL integration tests for real transaction rollback/concurrency, since mocked transaction objects do not prove locks or isolation. Keep external services mocked. Add a small browser suite for critical admin/customer workflows rather than snapshotting every primitive.

Validate migration replay against a disposable DB and compare with schema; separately document migration state for existing environments. Do not use db push/reset as a generic deployment repair. Test backup/restore of database and uploaded files.

Completion criteria: one documented command sequence works from a clean checkout, CI is green, test scope/limitations are explicit, and historical documentation is not mistaken for current verification.

## 9. Prepare a reusable domain template only after the above

Extract configuration for brand/navigation/locale and isolate lens/optical services from reusable account/admin infrastructure. Keep schema changes explicit rather than hiding unrelated domains behind a large generic entity engine. Use the guide's repurposing table to identify optical fields, calendars, units, statuses, providers and verification requirements that must change together.

Completion criteria: a new domain can keep the same admin page/form/table/action structure while replacing its business models and policies. Historical data migration and fresh-fork setup remain separate documented procedures.
