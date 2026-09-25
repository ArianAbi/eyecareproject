# Improvement suggestions

Updated 2026-09-25. F-01?F-18 fixes are implemented in source; see [findings](PROJECT_FINDINGS.md), [guide](PROJECT_GUIDE.md) and [deployment/validation](hardening-deployment.md). The items below are remaining proposals, not claims of implemented behavior.

## Delivered baseline

- Shared server/UI eligibility and integer pricing; strict catalog schemas and safe archive/delete relations (F-01, F-03, F-06?F-08).
- Minimal profile response with state/input validation and transactional audit (F-02, F-05).
- Server-only, bounded, awaited post-commit Bale delivery; correct route invalidation and serializable mutation failures (F-04, F-09, F-11, F-12).
- Explicit approved policy: daily delivery, disabled cutting/Telegram, no reopening refunded orders, snapshots for new history (F-10, F-16).
- Shared-DB count polling; paginated lists/histories/whole-user groups; SQL financial aggregation and audit filtering (F-13, F-14).
- Payment attempts/reconciliation, explicit configuration, session-independent verification and delayed idempotent credit at balance limits (F-15).
- Private owner/admin uploads, quota/removal/orphan cleanup and shared database operation limits (F-17, F-18).

## Further operational and financial improvements

- Replay migrations and test real PostgreSQL concurrency/rollback on disposable data. Run a production HTTP action/browser suite; mocked tests and a build do not prove these paths.
- Verify gateway terminal-state semantics/configuration in a designated sandbox, monitor old PENDING attempts and PAID invoices with creditAppliedAt null, and consider an authorized scheduled reconciliation worker. Current recovery is explicit owner retry, not an automatic scheduler.
- Add a durable notification outbox only if delivery retries/guarantees are required. Current best-effort delivery is observed but can fail without retry.
- Profile realistic query counts, row counts and latency. Daily pagination preserves entire users, so one extreme user group can still be large. Add indexes based on query plans. Review unbounded option catalogs separately if their size grows.
- Configure trusted ingress identities, host/WAF limits and persistent shared upload storage. Verify backup/restore of files and metadata. Add business-reference retention rules before using uploads in shared/private document workflows.
- Consider an append-only balance ledger. Do not invent legacy entries or purge daily-fee audit receipts, which provide idempotency. CASH receipts and CREDIT grants must stay distinct from profit/revenue.

## 3. Make the admin easier to extend

- Extract one ProductForm with create/edit initial values and callbacks, backed by one shared schema. Keep separate route pages as loaders. Preserve current field shorthand and Base UI composition instead of adding another form library.
- Use one typed navigation configuration from which sections/menu groups are derived, or validate that every menu group appears in a section. Keep current shell appearance and provider interfaces.
- Extend DataTable with stable getRowId and deliberate selection-reset behavior. Add pagination/sorting options explicitly rather than assuming TanStack enables them. Then decide whether to wire the existing bulk wrapper (F-20).
- Finish or hide tag edit/delete and empty create-user controls. Treat dialog create/edit, full-page editing, filters and tables as documented recipes (F-19).
- Centralize safe display helpers for money, counts, Tehran/Jalali dates and status labels. Preserve technical prescription signs and intentional LTR inputs.
- Consolidate unused/duplicate helpers only after checking imports: alternate providers/themes, duplicated category update helpers, old table wrappers and commented code are candidates, not automatic deletions.

Completion criteria: one sample new admin entity can reuse the shell, fields, actions, filters and list without modifying generic UI internals or duplicating feature-independent plumbing.

## 7. Improve form and mobile usability

Use unique IDs and associated labels for repeated forms and inclusion controls. Review custom focus jumps with keyboard/screen-reader testing. Normalize toast casing and avoid duplicate failure messages. Handle invalid URL tabs with a default, and use notFound for missing product records. Implement or remove emptySnapValue rather than advertising unused behavior (F-21).

Test actual RTL layouts at narrow/mobile widths, long Persian names, empty lists, validation errors and dialog/sheet focus return. If Persian digits should be accepted in numeric fields, normalize them deliberately before validation instead of assuming inputMode performs conversion.

Completion criteria: all controls have names, predictable keyboard access and visible pending/error state; numeric previews equal saved values; filters preserve unrelated URL state and reset the correct page keys.

## 8. Establish reproducible checks and setup

CJS lint support, test/typecheck scripts and gateway/storage/rate-limit environment names are implemented. Remaining F-22 work includes unused declarations, the columns.txs typo and auth adapter/model review. Add CI for existing tests, types, lint and production build; consider local fonts for predictable builds (F-22).

Action/domain tests now cover eligibility, eye combinations, rounding, profile return/state, authorization, payment retry/credit limits, private uploads and refunded-state transitions. Add disposable PostgreSQL integration tests for real transaction rollback/concurrency, since mocked transaction objects do not prove locks or isolation. Keep external services mocked. Add a small browser suite for critical admin/customer workflows rather than snapshotting every primitive.

Validate migration replay against a disposable DB and compare with schema; separately document migration state for existing environments. Do not use db push/reset as a generic deployment repair. Test backup/restore of database and uploaded files.

Completion criteria: one documented command sequence works from a clean checkout, CI is green, test scope/limitations are explicit, and historical documentation is not mistaken for current verification.

## 9. Prepare a reusable domain template only after the above

Extract configuration for brand/navigation/locale and isolate lens/optical services from reusable account/admin infrastructure. Keep schema changes explicit rather than hiding unrelated domains behind a large generic entity engine. Use the guide's repurposing table to identify optical fields, calendars, units, statuses, providers and verification requirements that must change together.

Completion criteria: a new domain can keep the same admin page/form/table/action structure while replacing its business models and policies. Historical data migration and fresh-fork setup remain separate documented procedures.
