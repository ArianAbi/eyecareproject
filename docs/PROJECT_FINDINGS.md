# Bugs and design findings

Reviewed 2026-09-24. This is a source review, not a penetration test or production incident report. Application behavior was not changed. **Confirmed** means directly supported by code or a recorded local check; **risk** means the failure depends on deployment, business policy or an untested runtime path. Priorities indicate recommended attention, not a measured exploit score. See [implementation guide](PROJECT_GUIDE.md) and [improvements](PROJECT_IMPROVEMENTS.md).

## High priority

### F-01 — Customer checkout bypasses verification and product eligibility rules

**Confirmed missing server checks.** `AddItemToCartAction` and `SubmitCartOrderAction` in `lib/actions/cart.actions.ts` authenticate but do not enforce VERIFIED user status, active LENS products or prescription bounds. `GlasslensOrderPage.tsx` gates submission in the browser. Admin cart actions check verification at submission and active/type eligibility, but do not validate prescriptions against the selected product's Lens ranges either.

An authenticated caller can bypass the UI. An unverified account with sufficient credit can submit; inactive products already in a cart remain orderable through customer submission. Product prices and available balance are checked server-side, so this is not a claim that clients can set product prices or spend arbitrary nonexistent credit.

**Verify/fix:** direct action tests with unverified users, inactive/non-lens products, out-of-range/invalid eye values and a product disabled after adding. Share a server-side eligibility policy between customer/admin actions and recheck at checkout.

### F-02 — Profile save returns the password hash

**Confirmed return-shape defect.** `SaveProfileInfoAction` in `lib/actions/profile.action.ts` calls `prisma.user.update` without select/omit and returns `{success:true,data}`. The User scalar result includes `password`. `ProfileForm` invokes this from the browser, even though it ignores the response.

This exposes the signed-in user's stored password hash unnecessarily in the action response; it is not evidence of another user's hash being exposed.

**Verify/fix:** assert that successful action output never contains password; return success only or a small explicit DTO. Inspect other mutation return shapes similarly.

### F-03 — Lens availability expression can ignore the right-eye result

**Confirmed expression defect.** `components/LensProductItem.tsx` builds InRange using `odValid && range.odOnly ? true : osValid` inside the surrounding expression. With two-eye mode, the ternary's condition is false and availability is decided by OS, even when OD is out of range. In OD-only mode with invalid OD, it can also fall back to valid OS.

`components/core/CategoryDialog.tsx` separately assigns `odValue.cyl = range.od.sph` rather than `range.od.cyl`. Its computed `product.available` is not used by LensProductItem's final decision, so this second defect currently lives in duplicated/dead eligibility calculation rather than being the only source of the visible bug.

**Verify/fix:** table-driven OD/OS tests covering each valid/invalid combination and OD-only. Use one shared expression equivalent to `odValid && (odOnly || osValid)`, and enforce the same policy on the server.

### F-04 — Bale transport is declared as an unguarded Server Action

**Confirmed unsafe boundary; remote reachability not probed.** `lib/actions/bale.actions.ts` has module-level `use server` and exports BALE_SendMessage with arbitrary message input and no authentication/authorization/length limit. A reusable privileged bot transport should not rely on the identity checks of whichever caller happens to use it. Whether this server-only-used export is exposed in a specific production action manifest was not tested.

**Verify/fix:** move the bot transport to a server-only module, with authorized business actions creating bounded messages. Review the production action manifest without sending real messages. Do not simply require login in the helper without considering public signup's legitimate notification flow.

## Medium priority

### F-05 — Profile state restrictions exist only in the UI

**Confirmed.** ProfileForm disables edits for VERIFIED/WAITING_FOR_APPROVAL. SaveProfileInfoAction only checks nationalCode length and always sets WAITING_FOR_APPROVAL. Direct invocation bypasses the intended state restriction; ten non-digit characters also pass its length check. Address/management name lack equivalent server limits and the mutation lacks a writeAudit entry.

**Verify/fix:** validate full input and current allowed state server-side, audit the change transactionally, and test verified/waiting accounts plus malformed and oversized fields.

### F-06 — Client/server single-eye rounding differs

**Confirmed.** GlasslensOrderPage and LensProductItem divide price by two directly; checkout actions use Math.round. For a product priced 101 Toman, the UI can display 50.5 while the recorded charge is 51. Multiple odd-price items compound the difference.

**Verify/fix:** share an integer pricing helper between preview and checkout. Cover odd prices, multiple rows and balance exactly at the rounded total.

### F-07 — Product validation and create contract are incomplete

**Confirmed.** `admin.products.action.ts` parses price and includesGuarantee but relies on TypeScript/Prisma for much of the remaining input. Client minimum name/description lengths and range rules are not enforced equivalently. Update spreads remaining scalar input into Prisma. Create accepts `active` but never writes it, so false is silently ignored and the DB default true wins. Current UI always sends true, limiting ordinary UI impact of that specific bug.

**Verify/fix:** shared complete Zod schema with explicit allowed fields, enum/UUID/length/range validation and intentional relation/type rules. Test direct invocation rather than only valid form submissions.

### F-08 — Product deletion trusts an unrelated Lens ID

**Confirmed contract defect; normal UI sends matching IDs.** ADMIN_DeleteProduct(id,lensId) deletes Lens by caller-supplied ID without verifying product ownership of that Lens. A crafted admin call with a different product's lens and a deletable target without its own lens can remove unrelated lens data. Foreign keys can also make deletion of historically ordered/cart-referenced products fail with a generic error.

**Verify/fix:** look up the related Lens on the server by product ID. Define archive/delete behavior for referenced products, and test mismatched IDs plus cart/order references. Transaction rollback protects failures but does not validate the supplied relationship.

### F-09 — Master-category actions invalidate the wrong route

**Confirmed path mismatch; user-visible staleness depends on navigation/refresh.** All three mutations in `admin.masterCategory.actions.ts` invalidate `/admin/product-category`, while the management list is `/admin/master-category`. Existing client behavior may mask this. Several order/invoice/ticket actions also invalidate nonexistent `/admin/summary`.

**Verify/fix:** invalidate actual affected list/detail/count routes after commit. Confirm list and related option data update after create/edit/delete without manual reload.

### F-10 — Settings have only partial consumers

**Confirmed incomplete integration, not proof of a billing requirement.** cutPrice is stored but both checkout actions hard-code zero. SubmitOrderBtn sends delivery zero, while actions accept caller-supplied delivery. Setting.deliveryPrice is consumed by the separate daily-fee workflow, not automatic checkout. Stored baleGroupId is ignored by the bot's BALE_CHAT_ID env lookup; telegramGroupId has no sender. SettingsForm's note saying costs are not applied predates daily delivery fees and is now overly broad.

**Verify/fix:** decide whether delivery is once per day or per order and how cutting should be charged, then implement the server rule. Either connect messaging settings or clearly label them as inactive. Avoid accidentally charging daily and per-order delivery twice.

### F-11 — ActionError assumes error messages survive production

**Confirmed fragile contract; production reproduction not run.** `lib/action-error.ts` comments that JSON Error.message survives the server/client boundary. Many actions throw it and clients parse it. Installed Next error-handling guidance says expected errors should be returned, and server error details may be sanitized in production. Meaningful validation messages may turn into a generic fallback. Some development errors include raw Prisma messages.

**Verify/fix:** return typed expected-error objects with safe field/form messages; reserve thrown errors for unexpected failures. Test the production build's action failure behavior, not only dev serialization.

### F-12 — Notifications can be lost or reject unobserved

**Confirmed promise/error-handling gaps.** Signup, invoices, tickets and profile invoke BALE_SendMessage without awaiting/catching it. Signup does so inside a transaction before commit. Bot helper parses JSON but does not check HTTP/API success. Checkout does await it after commit in a separate catch, which is a better boundary, although API error JSON may still look like success to the caller. Ticket notification uses user.name while credentials populate username.

**Verify/fix:** use post-commit observed delivery or an outbox, check response success and add timeouts. Mock delivery failures and rollbacks; do not send real messages in tests.

### F-13 — Real-time order count has deployment and notification limits

**Confirmed design limits.** `lib/order-event.ts` is process-local. Streams in another worker/instance do not receive events. Stream has no heartbeat/shared recovery mechanism. Submission emits a new count, but ADMIN_UpdateOrderStatus does not emit one, so the badge can remain stale after an order leaves PENDING. AdminProviders skips only the first toast and labels every later count event as a new order, including a reconnect's initial count.

**Verify/fix:** publish count changes for status mutations, distinguish event types/count direction, test reconnect and status change, and choose shared pub/sub or polling for multiple instances. Review listener cleanup and long-lived connection behavior in the target host.

### F-14 — List/report loading can grow without bounds

**Confirmed scaling risks, not measured performance failures.** Product and main user lists fetch all matching records; daily grouped order queries intentionally fetch all orders for a day. Financial action fetches matching paid invoices and buckets them in JS, including all-time mode. Admin user detail first fetches all related entity IDs to construct audit queries. Order detail/history and ticket conversations are unbounded. Admin orders loads pending/rest plus grouped sections even when another tab is active.

**Verify/fix:** profile realistic data; paginate where UX permits, aggregate reports in SQL, load active sections deliberately and avoid huge ID lists. Preserve complete daily user groups when adding pagination.

### F-15 — Payment lifecycle is incomplete

**Confirmed limitations, live gateway behavior unverified.** PayInvoiceAction always reuses a saved authority with no expiry/reconciliation flow. Callback requires a logged-in owner, so a lost session cannot complete local verification automatically. Sandbox/placeholder merchant defaults can hide missing deployment configuration. Integer credit increments can also exceed the DB limit even when each invoice amount itself is valid, causing transaction failure after an external payment.

**Verify/fix:** model payment attempts, retry/reconciliation and bounded/expanded balances. Verify provider requirements in official docs before implementation. Use gateway mocks/designated sandbox; this review initiated no payments and does not claim the provider configuration is valid or invalid.

### F-16 — Refund reopening and historical data require explicit policy

**Confirmed behavior; business risk depends on policy.** saveOrderUpdate allows moving a refunded order to processing/sent without recharging. History reads current product name/category/packaging flags although prices and guarantee fields are snapshots. CREDIT PAID means a balance grant, not cash collection, and daily fees sit outside original order totals/refunds.

**Verify/fix:** define permitted transitions after refund, snapshot requirements and reporting meanings before treating reports as accounting records. Test any chosen policy without inventing historical balances.

### F-17 — Upload persistence/access controls are intentionally minimal

**Confirmed design limitation.** Authenticated users can upload but there is no quota, owner/reference record or file cleanup; the GET route is public by UUID filename. UUID obscurity is not authorization. Form removal leaves files. Default local disk is unsuitable for ephemeral or independently replicated instances.

**Verify/fix:** determine whether assets are public or private, add metadata/quota/cleanup and persistent shared storage as appropriate. Existing decoding/type/size limits and metadata stripping are useful protections and should be retained.

### F-18 — Application-level rate limits were not found

**Risk; infrastructure unknown.** No application limiter was found around login, signup, uploads, public traffic tracking or ticket creation. Password verification uses deliberately expensive scrypt; arbitrary session-cookie UUIDs can create repeated analytics rows. Host/WAF protections were not inspected.

**Verify/fix:** document existing infrastructure limits and add per-operation controls where needed. Test with local mocks, not traffic against live services.

## Lower priority / maintainability

### F-19 — Visible controls and helpers are unfinished or disconnected

**Confirmed.** Tags column renders literal Edit/Delete without handlers. AdminCreateUserBtn opens an empty dialog. AdminOrderDataTableWrapper has a bulk implementation but no caller; live pending/rest tables do not enable it. `GetProductCategoryItems(id)` queries Product.id rather than categoryId; no caller was found, so this is a latent helper defect rather than a reproduced screen failure.

**Verify/fix:** complete or remove placeholders and clarify helper contracts. Wire bulk operations only after stable selection behavior is addressed.

### F-20 — Table selection uses positional identity

**Confirmed component risk.** DataTable omits getRowId, so TanStack defaults to index IDs. Selection/status can attach to a different record when props reorder or refresh. Pending status timers are not explicitly cleaned up; trigger relies on caller UI to prevent concurrent invocation. Bulk wrapper is currently unmounted, reducing active exposure.

**Verify/fix:** require stable record IDs for selectable tables, reset/reconcile selection after data changes, guard pending work, and test reorder/delete/refresh during selection.

### F-21 — Form/UI details are inconsistent

**Confirmed source observations; accessibility effects need browser testing.** Combobox shorthand accepts emptySnapValue but never consumes it; null selection is ignored. Shorthand IDs are derived only from field name, allowing collisions if multiple forms with the same field are mounted. Select/combobox have custom next-focus logic. Some inclusion checkboxes have adjacent text/icons without associated labels. SubmitOrderBtn emits two error toasts for Error instances. Some toast types are uppercase, so icons are missing. Tabs accepts arbitrary URL values and can select no matching panel.

**Verify/fix:** remove or implement unused props, use per-instance IDs, label controls, test keyboard/focus in dialogs and repeated forms, normalize toasts and validate tab keys.

### F-22 — Tooling and setup documentation gaps

**Confirmed local checks.** All 12 current tests pass; TypeScript passes. `npm.cmd run lint` exits 1: 20 errors in the three CJS test harnesses (require imports and module variable rule), 10 warnings for unused declarations in application files. package.json has no test script. env.example omits gateway/storage variables. tsconfig includes a nonexistent `app/admin/users/columns.txs` entry. Auth.js PrismaAdapter is configured without its OAuth/database-session model set; current credentials/JWT usage is not proof those future modes will work.

**Verify/fix:** scope lint rules for the intentional test format, remove unused code/typo, add reproducible scripts and complete env names. Review adapter/schema before expanding authentication.

## Documentation cleanup performed

- Removed obsolete `bugs.md`: mixed fixed history with now-false no-credit-debit and migration claims.
- Removed obsolete `changes.md`: referenced absent summary route, migration and test files, and an outdated fixed 14-day financial report.
- Removed obsolete `OrderUpdate.md`: useful behavior moved to the guide; missing integration-test commands and old build/type-check claims were discarded.
- Replaced starter README with current documentation links and commands.
- Retained `doc/order-management.md` and `docs/image-uploads.md`, which still describe current feature contracts. Retained `todos.txt` as historical requirements, not current implementation documentation.

No previous "passed" result was imported as a current check. A production build, browser reproduction, database migration replay/concurrency test and external integration verification remain unperformed.
