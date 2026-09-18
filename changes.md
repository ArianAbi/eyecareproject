# Changes from todos.txt

## Status and setup

The requested main pages and workflows are implemented. **The database was not changed**, no payment was initiated, and nothing was deployed. Existing edits were preserved, including the glasslens-order UI and password hashing work already present when this task began.

Before using the new features:

1. Read the migration warning in `bugs.md`. Existing migration history does not match the schema that was present at task start.
2. For an existing database matching that pre-task schema, review `prisma/migrations/20260918000000_tickets_invoices_audit/migration.sql`, back up the database, and apply it through your reconciled Prisma migration process. Do not reset your database. The SQL is additive and was written manually because Prisma's diff engine could not spawn in this environment.
3. For a fresh disposable development database, `npx prisma db push` can create the current schema; establish a proper migration baseline before production.
4. Run `npx prisma generate` after schema changes. Client generation was already run locally.
5. Set `APP_URL` to the public site origin. Payments also use your existing `ZARINPAL_MERCHANT_ID` and `ZARINPAL_SANDBOX`. No `.env` values were changed or printed.

## Feature map and editing guide

| Feature / URL | Main files | What to change there |
| --- | --- | --- |
| Landing `/` | `app/(main)/page.tsx` | Persian B2B copy, calls to action, service cards and homepage metadata. Uses existing shadcn cards/buttons/badges and Lucide icons. |
| User tickets `/tickets`, `/tickets/[id]` | `lib/actions/tickets.action.ts`, `components/core/TicketPages.tsx`, `TicketForm.tsx` | Ticket validation, ownership, list, conversation, replies and close behavior. |
| Admin tickets `/admin/tickets`, `/admin/tickets/[id]` | Same shared ticket components/actions | Admin list/replies/close. Server chooses the author role; clients cannot impersonate admin replies. |
| Invoices `/invoices`, `/invoices/[id]` | `lib/actions/invoices.action.ts`, `components/core/InvoiceList.tsx`, `InvoiceControls.tsx`, `app/(main)/invoices/*` | Balance, invoice creation, filtering, details and gateway button. |
| Admin invoices `/admin/invoices`, `/admin/invoices/[id]` | `lib/actions/admin.invoices.action.ts`, shared invoice components | Review waiting CREDIT requests, approve/reject, inspect invoice details. |
| Payment callback `/invoices/verify` | `app/(main)/invoices/verify/route.ts`, `VerifyInvoicePaymentAction` | Callback handling and verification. User ownership is checked; repeat callbacks cannot increment balance twice. |
| User/admin orders | `lib/actions/orders.action.ts`, `admin.orders.action.ts`, `lib/order-filters.ts`, `components/core/OrderFilters.tsx` | Shared query construction; dates, status, order number, sort and admin user filtering. |
| Admin summary `/admin/summary` | `app/admin/summary/page.tsx`, `lib/actions/admin.summary.action.ts` | Default daily orders view, selected day, counts, compact order links, financial and ticket tabs. |
| Financial `/admin/financial` | `components/core/FinancialSummary.tsx`, summary actions | 14-day cash/credit chart, outstanding credit requests, current total user balances. Adjust the 14-day window in the action. |
| Logs `/admin/logs` | `lib/audit.ts`, `lib/actions/admin.logs.action.ts`, `app/admin/logs/page.tsx` | Event storage and filters for actor, date, exact event name and entity type. |
| Sidebars | `components/core/CustomSidebar.tsx` | Added items through existing `AdminSidebarData` and `UserSidebarData`. Admin invoice link corrected. |
| Access checks | `lib/access.ts`, private section layouts, `app/admin/layout.tsx` | Session checks and current database admin role. Layout checks are complemented by action checks. |
| Standalone admin action | `lib/actions/isAdmin.action.ts` | `isAdmin()` returns a boolean. It is intentionally not imported by any other action. |
| SEO | `app/layout.tsx`, homepage metadata, `app/robots.ts`, `app/sitemap.ts` | Persian language, titles/descriptions, Open Graph/Twitter metadata, canonical URL, public sitemap. Private account/admin/auth pages are noindex. |

## Behavior details

### Tickets

- `Ticket`, `TicketMessage` and `TicketStatus` were added to Prisma, with user relations and indexes.
- Subjects are trimmed, 3–150 characters; messages are trimmed, 1–5000 characters. Change the Zod schemas in `tickets.action.ts` to adjust these limits.
- Users see only their own tickets. Admins see all tickets. Both can close a ticket; closed tickets cannot receive messages. There is no reopen or attachment flow.
- Reply and close operations update the parent row transactionally, preventing a reply from slipping into a concurrently closed ticket.
- Lists are paginated, filter by open/closed and show whether the latest reply came from support.

### Invoices and finances

- Invoice additions: `zarinpalAuthority` (unique), `zarinpalRefId`, `paidAt` and a status/date index.
- CASH creation produces PENDING; CREDIT creation produces WAITING_FOR_APPORVAL. Amounts must be integer Toman values between 1,000 and PostgreSQL's signed integer limit.
- Admin approval changes a waiting CREDIT request to PAID and increments credit in one transaction. Conditional updates prevent duplicate approval. Rejection cancels only waiting CREDIT requests.
- CASH is paid through gateway verification, not admin approval. Verification uses the stored amount and authority, checks the authenticated owner, and conditionally credits only a PENDING invoice.
- New invoice submission opens its detail page. Detail/list pages expose appropriate payment or review controls with pending/error feedback.
- Current balance is fetched from the database on the invoice page and header.
- Financial graphs use **paidAt**, not invoice creation time. Cash receipts and credit grants are separate; this is not a profit/loss or debt settlement report. Existing paid records without paidAt are not silently backfilled.
- See payment retry and gateway limitations in `bugs.md` before production.

### Orders, filters and summaries

- `QueryFilters.tsx` contains shared shadcn filter controls; `OrderFilters.tsx` supplies order-specific statuses.
- Both admin tabs receive user/date/order-number/sort filters. Pending always means PENDING; the other tab excludes it unless a specific other status is chosen.
- Date filters accept the existing JSON `{ from: "YYYY-MM-DD", to?: "YYYY-MM-DD" }` URL value. `lib/prisma-date-filter.ts` turns it into Tehran-day `gte` / exclusive `lt` bounds and rejects malformed/reversed values.
- Filter changes clear page keys. Existing Persian calendar controls remain in use. The compact summary day selector is a native Gregorian date input, explicitly labeled.
- User orders now honor URL pagination and share status/date/order-number/sort filtering. List totals include purchased price, cutting and delivery through `calculateOrderTotal`.
- Admin status changes add OrderUpdate history and an audit entry in the same transaction.
- Daily summary aggregates cover the full selected day; only the compact order list is paginated (20 rows).
- Ticket summary counts are explicitly all-time/current status. Financial summary is the 14-day window ending on the selected day.
- `/glasslens-order` UI files were not edited by this task. Its new layout checks sign-in and excludes it from indexing; server cart actions received ownership/logging fixes.

### Audit and security

- `writeAudit(tx, actorId, action, entityType, entityId, detail)` writes an explicit event. To add a new mutation log, call it inside that mutation's transaction before returning.
- Logged events: account creation, sign-in/out, cart add/update/delete, order submission/status, invoice creation/approval/rejection/payment start/verification, ticket creation/reply/close, catalog creation/update/deletion.
- Event details intentionally exclude passwords, payment authorities, prescription payloads and ticket message bodies. No unrestricted payload serialization is used.
- Catalog writes now run transactionally with their logs; catalog/user administration reads also check admin access. Authentication logs use Auth.js events.
- Cart actions derive owner IDs from session even where the legacy signature still accepts a user ID.
- Submission uses a Serializable transaction and sends the existing live-count event only after commit. The order stream now checks admin access and starts with the pending count.
- Existing unrelated compilation errors were corrected in `app/admin/products/tags/column.tsx` and `components/core/CreateProductCategory.tsx`.

## Verification and manual checklist

- Tests were written before implementation in `tests/workflows.test.cjs`; failures were observed for the missing/broken behavior, then fixed. Additional access tests are in `tests/access.test.cjs`; `tests/load.cjs` loads TypeScript with mocked dependencies.
- 25 tests passed, including existing password/cart tests, date bounds, invalid pagination, totals, authorization, ownership, invoice validation, duplicate credit prevention, ticket restrictions and audit behavior.
- TypeScript `tsc --noEmit` passed. Prisma client generation and schema validation passed. Targeted ESLint checks for new workflow/action/components passed.
- Production build was attempted but failed because this environment could not download the existing Google Fonts (Geist, Geist Mono, Inter and Noto Sans Arabic). TypeScript was rerun afterward and passed. A successful production build is still required in an environment with font access or after self-hosting the fonts.
- Tests mock Prisma and the gateway: they do not replace database concurrency, browser or live merchant tests. No database migration or real payment was performed.
- Run tests: `node --test --test-isolation=none tests/workflows.test.cjs tests/access.test.cjs lib/actions/cart.actions.test.cjs lib/password.test.mjs`. Isolation is disabled because this sandbox blocks test-worker process spawning.
- Run type checks: `npx tsc --noEmit`. Run production validation: `npm run build`.

After database setup, manually check:

1. Open `/` signed out; check Persian copy and login/signup links. Private URLs should require sign-in.
2. Create a user ticket, reply as admin, reply as owner, close it and confirm neither side can reply afterward. A second user must not access it.
3. Request credit, approve/reject as admin, refresh and confirm one balance change only. Confirm an ordinary user cannot invoke admin operations.
4. Create a CASH invoice and use the merchant sandbox. Repeat its callback and check the balance remains unchanged after the first successful verification.
5. Filter both admin order tabs by user/date/number; move to another page, change filters, and verify pagination resets. Check user order totals and page 2.
6. Change an order's status and inspect its history and `/admin/logs`.
7. Check today's and another day's `/admin/summary`; compare full-day totals with underlying orders. Verify `/admin/financial` keeps cash and credit separate.
8. Check `/robots.txt`, `/sitemap.xml`, homepage canonical and private-page noindex tags after configuring APP_URL.

## Preserved prior work

Pre-existing edits included `CartOrderItem.tsx`, `GlasslensOrderPage.tsx`, sidebar changes, `env.example`, Auth/auth/cart files, the lockfile and password/cart tests. This task did not revert them. Auth/cart/sidebar files were extended in place; password handling was preserved. `todos.txt` was left intact as the original request.
