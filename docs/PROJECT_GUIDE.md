# Project implementation and LLM guide

Reviewed: 2026-09-24; F-01?F-18 updated 2026-09-25. This describes the checked-out source, not a deployed environment. Read [findings](PROJECT_FINDINGS.md) before copying existing patterns. Proposed changes are separately recorded in [improvements](PROJECT_IMPROVEMENTS.md).

## Instructions for future LLMs

1. Read `AGENTS.md`, this guide, and relevant current source before editing. `CLAUDE.md` points to `AGENTS.md`. Newer user instructions take precedence.
2. Follow current user instructions: never inspect or modify node_modules, and never add `toLocaleString("fa-IR")`. This overrides the conflicting bundled-doc instruction in AGENTS.md. Do not assume older Next.js or Radix conventions.
3. Preserve server page/client interaction boundaries, local shadcn/Base UI components, the admin shell, RTL, URL filters, authorization and transactional auditing.
4. Treat every sensitive action as an independent entry point. Layouts, proxy checks and disabled controls do not replace action authorization or runtime validation.
5. Do not edit generated Prisma code. Change schema/migrations deliberately and regenerate; preserve persisted field/enum spellings unless coordinating a migration.
6. Update this guide when contracts change. Findings and suggestions are not implemented features. Never copy secrets into documentation.

## Application and stack

This is a Persian B2B optical ordering portal. Customers register, request profile verification, build prescription-based lens orders, fund a credit balance through invoices, view order updates and contact support. Admins manage users, catalog, orders, credit, daily fees, tickets, reports and settings. Admins can build orders using a selected customer's existing cart.

Branding currently mixes ICN with the settings fallback SalimOptic. Product types include LENS, FRAME and OTHER, but the implemented builder/forms focus on lenses. There is no stock/inventory model or full credit repayment ledger.

Versions below are declarations in `package.json`, not an audit of every installed transitive version.

| Area | Implementation |
| --- | --- |
| Framework | Next.js 16.2.10 App Router; React/React DOM 19.2.4 |
| Language | TypeScript strict mode; `@/*` resolves from repository root |
| Database | PostgreSQL; Prisma/client/pg adapter ^7.8.0; `pg` |
| Authentication | Auth.js `next-auth ^5.0.0-beta.31`, credentials, JWT sessions |
| UI | shadcn `base-rhea`, Base UI ^1.6.0, Lucide |
| Styling | Tailwind CSS 4, CSS variables, CVA, clsx/tailwind-merge, tw-animate-css |
| Forms | React Hook Form ^7.83.0, Zod ^4.4.3, Zod resolver |
| Tables/charts | TanStack React Table 8; Recharts 3 |
| Dates | date-fns-jalali, Persian day picker, Intl/Asia/Tehran |
| Images | Sharp and local filesystem; Node.js serving route |
| Integrations | ZarinPal, server-only Bale HTTP bot, database-polled order count |

`next.config.ts` sets Server Action request size to 6 MiB for 5 MiB uploads plus multipart overhead. Cache Components are not enabled. `getSettings` uses React `cache` for render/request deduplication, not permanent global caching. Use documentation appropriate to this configuration rather than examples requiring `cacheComponents: true`; honor the no-node_modules inspection instruction.

## Repository structure

| Path | Responsibility |
| --- | --- |
| `app/` | Routes, layouts, server loaders and colocated client feature controls |
| `app/(auth)/` | Login/signup shell; parentheses do not appear in URL |
| `app/(main)/` | Public landing and customer routes |
| `app/admin/` | Admin shell, dashboard and management screens |
| `app/api/` | Auth handlers, order-count JSON and private image serving |
| `components/ui/` | Locally owned shadcn/Base UI primitives and custom infrastructure |
| `components/core/` | Sidebar, shared domain controls, shorthand fields, filters, reports |
| `components/forms/` | Auth forms and error helper |
| `components/` | Order history/table, product item, account banner, landing video, logout |
| `lib/actions/` | Feature-named Server Functions for queries and mutations |
| `lib/` | Auth/DB/access, domain helpers, filters, storage, integrations |
| `lib/schemas/` | Shared auth/settings schemas; other schemas often remain inline |
| `hooks/`, `types/` | URL/mobile hooks, action/order/lens/sidebar types, Auth.js augmentation |
| `prisma/` | Schema and SQL migration history |
| `generated/prisma/` | Generated, Git-ignored Prisma client; never edit manually |
| `tests/` | Node test-runner CJS suites for domain/action/integration boundaries |
| `public/` | Landing MP4s, placeholder image, SVGs, verification text |
| `storage/uploads/` | Default runtime image directory, Git-ignored |
| `doc/`, `docs/` | Feature notes and current project references |

`app/globals.css` is the active stylesheet. `globals-all-black.css` and `globals-2nd-color.css` are alternatives, not imported by root layout. Sidebar-specific CSS is in `CustomSidebar.module.css`.

## Routes

| URL | Implementation |
| --- | --- |
| `/` | `app/(main)/page.tsx`, Persian landing, `components/landing-video.tsx`, local MP4s |
| `/login`, `/signup` | Auth route group and `components/forms/AuthForms.tsx` |
| `/profile` | ProfileForm, ProfileAccountStatus, verification workflow |
| `/profile/uploads` | Owner upload library/removal |
| `/glasslens-order` | Server loader + GlasslensOrderPage, CartOrderItem, GuaranteeDialog, SubmitOrderBtn |
| `/orders`, `/orders/[id]` | Customer-owned orders, filters, pagination, public updates and read acknowledgement |
| `/invoices`, `/invoices/[id]` | Funding requests, NewInvoiceForm, shared InvoiceList/InvoiceControls |
| `/invoices/verify` | Session-independent GET callback using server-only provider verification |
| `/tickets`, `/tickets/[id]` | Shared TicketPages server components and TicketForm client controls |
| `/admin` | Today's grouped orders and summary tabs for orders/financial/tickets |
| `/admin/products` | Server list, `columns.tsx`, create/edit links |
| `/admin/products/create`, `/admin/products/[id]` | Separate RHF product create/edit forms |
| `/admin/products/tags` | Create/list tags; edit/delete placeholders |
| `/admin/master-category` | Top-level category/type/active controls |
| `/admin/product-category` | Subcategory/parent/color/description management |
| `/admin/users`, `/admin/users/[id]` | User filters, related-record tabs, status/profile/credit controls; create dialog unfinished |
| `/admin/glasslens-order` | Customer selector and shared builder with `adminUserId` |
| `/admin/orders`, `/admin/orders/[id]` | Daily/history/pending/other tabs; status/message/private/refund controls |
| `/admin/invoices`, `/admin/invoices/[id]` | Review CREDIT requests and inspect payments |
| `/admin/tickets`, `/admin/tickets/[id]` | Shared ticket UI with admin actions |
| `/admin/financial`, `/admin/analytics`, `/admin/logs` | Financial chart, traffic-source analytics, audit lists |
| `/admin/settings` | Site name, fees, messaging group IDs |
| `/api/auth/[...nextauth]` | Auth.js handlers |
| `/api/orders/order-stream` | Admin-only no-store JSON pending count, polled every 15 seconds |
| `/api/images/[filename]` | Owner/admin-only uploaded WebP serving |
| `/robots.txt`, `/sitemap.xml` | Metadata routes; sitemap lists landing URL |

There is no `/admin/summary` page; affected invalidations target `/admin`. Dynamic pages use promised `params`/`searchParams` and await them.

## Layout, providers and navigation

- Root layout sets `lang=fa`, `dir=rtl`, a fixed dark class and Noto Sans Arabic through `next/font/google`. It mounts NextTopLoader, TrafficTracker, Base UI DirectionProvider, SessionProvider and Toaster. Metadata reads settings; verification meta is hard-coded.
- Main layout shows signed-in sidebar, header, account-verification banner and footer. It does not make the public landing private. Private feature layouts/proxy and actions provide further checks.
- Admin layout authenticates, re-reads `User.admin`, redirects denied users, loads approval/open-ticket/waiting-credit counts and composes SidebarProvider and AdminProviders.
- AdminProviders has three server-fed badge contexts and one client EventSource order-count context. Server-fed badges are snapshots until the layout refreshes. Header reads current credit from the database; JWT credit is not authoritative.
- `app/providers.tsx` provides another SessionProvider wrapper; root currently mounts SessionProvider directly.
- Main/admin `error.tsx` files supply section error UI. Check installed Next error-boundary APIs before changing them.

`components/core/CustomSidebar.tsx` owns AdminSidebarData/UserSidebarData **and** adminSections/userSections. Sections find groups by the normalized first menu item's path. When adding navigation, update both menu data and section registration or the new group may be invisible. Preserve right-side RTL, active links, badges, footer switch and CSS module. Badge callbacks currently call provider hooks; avoid extending that with changing conditional hook calls.

## Admin CRUD reference: products

```text
server page -> authorized read action -> Prisma
            -> client DataTable + client columns
create/edit server page -> option data -> client form
client form -> Server Action -> authorization/validation
            -> transaction (writes + audit)
            -> revalidation -> feedback/navigation
```

`app/admin/products/page.tsx` calls `ADMIN_GetProducts` and supplies `products.data` plus `AdminProductsColumn` to DataTable. `columns.tsx` defines cells, edit links and delete confirmation. Row types use `ActionData<typeof ADMIN_GetProducts>[0]`.

Create page loads categories/tags; `[id]/page.tsx` loads the product and options for AdminEditProductForm. `lib/actions/admin.products.action.ts` contains create/list/single/update/delete. Create writes Product and Lens in one transaction; update uses category connect, tag set, and Lens upsert/delete. Form `tags` becomes `tagIds`; includesSpray/includesCloth become includesCleaningSpray/includesCleaningCloth. Mutations audit and invalidate the product list.

Smaller catalog entities use dialog forms in colocated buttons/column files. Category creation constructs FormData; master-category and tag actions use scalar arguments. Existing naming varies (`column.tsx`/`columns.tsx`, `.action.ts`/`.actions.ts`, `categorys`). Follow local imports rather than mass-renaming unrelated code.

Product forms are useful layout examples, but their server validation is incomplete. Some catalog invalidations run inside transactions; prefer invalidating after commit for new code. Read findings before copying these actions.

## Forms and feedback

Complex forms use `useForm`, `zodResolver`, defaultValues and often `mode: onChange`; `handleSubmit` invokes an imported Server Action. Pending state generally uses `formState.isSubmitting` and Spinner. Product forms use useWatch for previews and setValue for inclusion checkboxes. SettingsForm demonstrates explicit `z.input`/`z.output` generics.

| Shared field | Contract |
| --- | --- |
| FormFieldShorthand | Generic RHF Control/Path, Controller + Field/Label/Error, input/textarea; number conversion; integerInput uses text/numeric and ASCII digits; empty numeric input becomes zero |
| FormFieldComboboxShorthand | `{label,value}` options; stores string but supplies option object to Base UI; LTR/filter support; focuses next control after selection |
| FormFieldSelectShorthand | String options and selected label, custom next-focus behavior |
| FormFieldTagsShorthand | Multiple tag IDs with color/label display |
| FormFieldColorSelectShorthand | Fixed color options and CSS maps; standalone ColorSelect export |
| FormFieldSwitchShorthand | Boolean RHF switch |

These use Controller plus `components/ui/field.tsx`, not the older shadcn Form/FormField context pattern. Helpers also include InputErrorMessage and TextError.

Auth forms share `lib/schemas/auth.schema.ts`; signup returns field errors; login preserves redirect exceptions. Settings schema is shared client/server. Product forms and server actions share strict runtime schemas in lib/schemas/product.ts.

Small workflows use controlled state/useTransition/form or click handlers instead: GuaranteeDialog, TicketForm, ProfileForm, InvoiceControls, DailyOrderFee and UserControls. There is no universal useActionState pattern; commented auth examples are not active code.

GuaranteeDialog reloads the saved optional name on open and reports pending state to its parent. UpdateCartItemGuaranteeAction trims/max-limits the name, verifies ownership and current guarantee eligibility, and independently requires admin access for an adminUserId override.

Mutation failures return safe result objects using actionResult or explicit handling. Queries retain their existing raw/data shapes and may throw. `GetSingleOrder` spells one success flag `sucess`. ActionData only works for functions returning `{data}`. Inspect actual types.

Legacy ActionError is retained for queries. Mutations return `{success:false,error}`; client unwrapActionResult throws a local ClientActionError only after receiving that serializable result. parseActionError recognizes the local error. Never depend on server exception messages surviving production sanitization. Toasts use the local `toast.add({title,description,type})` manager, not Sonner. Icon types are lowercase success/info/warning/error/loading; existing uppercase values do not match.

## shadcn/Base UI and styling

`components.json` declares base-rhea, RSC, TSX, RTL, neutral CSS variables and Lucide. `components/ui` is locally owned source with custom behavior; inspect before regenerating components.

- Compose triggers using Base UI `render`, e.g. `DialogTrigger render={<Button type="button" />}`. Do not substitute Radix asChild by habit.
- Button uses CVA and adds green/glass/boldOutline/edit variants. Links often use buttonVariants.
- Select/Combobox callbacks differ from native change events. Use the local value/object mapping.
- Tabs adds `paramKey`, controlling selection from URL query state through useSearchParamsUtil.
- DataTable, toast, attachment and sidebar are customized. Attachment is local presentation infrastructure, not a storage service.
- Preserve global RTL and LTR islands for prescriptions. Prefer logical spacing where practical. `cn` merges local classes.
- Theme variables/radii are in globals.css; root hard-codes dark mode rather than using a theme-switch provider.

## Tables, filters, pagination and dates

DataTable uses TanStack getCoreRowModel/flexRender; it does not fetch, sort or paginate automatically. Parent server actions supply rows; CustomPagination is separate. Optional selection supports concurrent per-row bulk callbacks, row statuses and a completion callback; metadata lives in lib/data-table-meta.ts.

The actual admin orders page uses plain DataTable for pending/rest. AdminOrderDataTableWrapper implements a bulk toolbar but has no importing caller in the reviewed tree. Do not describe that toolbar as live.

- `hooks/useSearchParams.ts` wraps router/path/search params with get/getAll/set/setMany/remove/removeMany. `lib/search-params.ts` preserves unrelated keys.
- QueryFilters, OrderFilters, DateFilter, AdminUserSearchFilter, SummaryDayFilter and CustomPagination compose list controls.
- Admin orders have pendingPage/restPage. User detail tabs have invoicesPage/ticketsPage/ordersPage/cartPage/logsPage.
- PaginationObjectDB defaults to 10 rows and bounds page input; dashboard summary uses 20. Admin user/product lists use 10-row pages. Order items/updates and ticket messages use separate 50-row pages; full order totals are independently aggregated. Daily groups use 20 users per dailyPage and stay intact.
- Selected user URL values may be JSON `{value,label}`; selectedUser extracts the ID.
- Date filters use JSON `{from:"YYYY-MM-DD",to?:"YYYY-MM-DD"}`. parseDateFilterParam validates and returns inclusive Tehran midnight/exclusive next-day bounds; malformed/reversed values are ignored.
- History uses separate Gregorian `day`. Displays often use Jalali; financial buckets use Persian calendar and Tehran hours. Numeric locales currently vary.

## Database and invariants

prisma/schema.prisma is authoritative. prisma.config.ts reads DATABASE_URL. lib/db.ts creates Prisma with PrismaPg, caches it in development with a field/version fingerprint and replaces incompatible cached clients. Regenerate/restart after schema changes as needed.

| Models | Meaning |
| --- | --- |
| User | Unique username/number, scrypt hash, admin flag, integer credit, profile/verification |
| MasterCategory -> SubCategory -> Product | Catalog hierarchy, types/active flags, prices, category color, inclusions |
| Lens, Tags | Product's optional one-to-one prescription ranges; many-to-many tags |
| Cart -> CartItem | One cart per user; prescription/axis/OD-only/RAW-CUT/guarantee name |
| OrderBatch -> OrderItem | User order/status/delivery/note/charge/refund marker; item snapshots |
| OrderUpdate | Batch/item optional relations, message/status, adminOnly/readAt/creditRefunded |
| Invoice | CASH/CREDIT funding, amount/status/authority/ref ID/paidAt, invoice number |
| Ticket -> TicketMessage | OPEN/CLOSED conversation, owner/author/admin-origin flag |
| AuditLog | Actor/action/entity/detail; also daily-fee idempotency receipts |
| TrafficVisit | Session UUID, source/referrer/UTM/time |
| Setting | Singleton global: siteName, deliveryPrice, cutPrice, Bale/Telegram group IDs |
| Notification | Schema exists; no complete workflow found |
| PaymentAttempt | Gateway authority history, status and check timestamps |
| ImageAsset | Private upload owner, size and filename |
| RateLimit | Shared atomic operation counters and expiry |

Preserve persisted spellings `orederIdentification`, `positivToSph`, `WAITING_FOR_APPORVAL`. User states are UNVERIFIED, WAITING_FOR_APPROVAL, VERIFIED, REJECTED. Order states are PENDING, APPROVED, INPROCESS, FINISHED, SENT, ONHOLD; ONHOLD displays as rejected.

Application amounts are integer Toman; respect PostgreSQL Int limits. Gateway code multiplies by 10. This records implementation, not verification of current external gateway requirements.

### Cart and checkout

GlasslensOrderPage uses RHF for prescriptions and local cart rows with temporary IDs and pending/success/error states. Adds reconcile returned cart-item IDs. Pending counters coordinate guarantee/update/clear/submit. New server props resynchronize local rows. Admin mode switches action calls and edits the selected user's real cart.

Both submit actions read database product prices, charge credit, create batch/items, clear the cart and audit within a Serializable transaction. chargeOrderCredit decrements conditionally on sufficient balance. Shared lensPrice rounds single-eye prices identically in UI and checkout. Both action families use lens-policy to validate current VERIFIED status, active LENS products, powers/ranges and axes. Checkout requires deliveryPrice 0; cutPrice stays 0 by approved policy. Daily delivery fees remain separate.

creditCharged snapshots the debit. OrderItem snapshots purchase price, prescription, guarantee flag/name. New items also store productSnapshot (name/category/color/packaging); detail loaders restore those values. Legacy null snapshots fall back to current catalog data and are not fabricated by migration.

### Updates/refunds/read acknowledgement

saveOrderUpdate locks the batch with FOR UPDATE and atomically writes status/update/audit/optional refund. Message-only updates are supported; unchanged status without message/refund is a no-op. adminOnly hides that entry, not the batch's current status.

Refund is explicit, requires resulting ONHOLD status, uses creditCharged and is once-only through creditRefundedAt. Legacy zero-charge orders cannot automatically refund. Moving a refunded order out of ONHOLD is rejected; create a new charged order instead. Refunds check credit headroom before incrementing. Daily fees are separate from original refundable charge.

Customer queries filter private entries in the DB. OrderUpdateHistory acknowledges only displayed IDs; MarkOrderUpdatesRead checks owner/batch/public/unread and accepts up to 500 IDs per call. Prefetch/listing alone does not mark read. Admin history is available through updatesPage pagination; only displayed public entries are acknowledged.

### Daily fees

TodaysOrdersSection is the server loader; TodaysOrders groups whole users within a 20-user page and offers local filters/status controls for that page. Historical dates select order creation day, while balances/status remain current.

deductDailyOrderCharge locks User, validates expected credit/current day/settings and writes debit, audit receipt and customer-visible update together. Delivery receipt IDs are `daily-delivery:<day>:<userId>`; custom IDs use request UUID. **Do not purge those audit receipts as ordinary logs: they prevent duplicate charges.** See [daily management](../doc/order-management.md).

### Invoices, support and user management

- CASH starts PENDING, persists a gateway authority and credits balance only after verification. Conditional transitions prevent duplicate credits. Callbacks verify with the provider without a browser session. PaymentAttempt retains authorities; retries reconcile first and replace only provider-confirmed FAILED attempts after a local 15-minute reuse window. PAID receipts persist separately from bounded, once-only credit application (creditAppliedAt). See [payment recovery](payment-recovery.md).
- CREDIT starts WAITING_FOR_APPORVAL; admin approval marks PAID and increments credit transactionally; rejection marks CANCELED. Credit grants are not cash receipts or repayment records.
- Tickets share UI but have separate customer/admin actions. Server chooses author/admin flag; reply/close serialize through the OPEN parent. No reopen/attachment integration exists.
- Admin user detail loads paginated related lists. Status/credit edits compare expected values and audit transactionally. Customer profile submission enforces allowed state/complete validation, writes an audit and returns no User record.
- Financial queries aggregate paid invoices in SQL by Tehran hour/day before Jalali bucketing. FinancialSummaryCard calls ADMIN_GetFinancialSummaryAction with today/this month/months/this year/all time. Reports use paidAt and separate CASH/CREDIT; they are not profit/loss or a complete balance ledger. The dashboard's selected order day is not passed into the card.

## Authorization and integrations

lib/Auth.ts validates credentials, looks up users, verifies versioned scrypt hashes and copies id/username/phone/credit into JWT/session callbacks. No plaintext fallback exists. PrismaAdapter is configured, but Account/Session/VerificationToken models are absent: review before adding OAuth/database sessions.

requireUser derives session identity; requireAdmin rechecks DB role. Customer ownership belongs in Prisma where clauses. proxy.ts rejects private prefixes/checks admin prefixes, but does not replace these guards.

| Integration | Implementation/limits |
| --- | --- |
| Bale | lib/bale.ts is server-only; awaited post-commit, bounded, eight-second timeout, checked HTTP/API result; stored group ID takes precedence over env fallback |
| ZarinPal | Explicit merchant/mode, timeout, persisted attempts, session-independent verification and owner reconciliation; live gateway not exercised |
| Order count | Admin-only database polling every 15 seconds, no-store; no count-based new-order toast |
| Analytics | Public validated UUID session cookie/source input; createMany skipDuplicates; first-touch tracker excludes admin; not trusted user identity |
| Uploads | Signed-in users; still JPEG/PNG/WebP <=5 MiB and <=40MP; Sharp strips metadata/re-encodes <=2048 edge; UUID WebP and 10x10 blur data URL |

Uploaded files are private to owner/admin with no-store caching. ImageAsset tracks ownership/size; quotas, rate limits, deletion, an owner library and orphan cleanup are implemented. Product has no image reference field. Production requires explicit persistent shared storage; see [image uploads](image-uploads.md).

Revalidation is not a broadcast. Pending-order badges poll shared database state across workers; full tables and other server-fed badges still need refreshed data.

## Setup and verification

| Environment variable | Purpose |
| --- | --- |
| DATABASE_URL | PostgreSQL |
| AUTH_SECRET | Auth.js signing |
| APP_URL | Metadata/SEO origin and payment callback |
| NEXT_SUPPORT_NUMBER | Server-rendered footer number |
| BALE_CHAT_ID, BALE_BOT_TOKEN | Current bot integration |
| ZARINPAL_MERCHANT_ID, ZARINPAL_SANDBOX | Explicit merchant and true/false mode required; see env.example |
| IMAGE_UPLOAD_DIR | Required persistent upload directory in production |
| RATE_LIMIT_IP_HEADER | Trusted ingress-overwritten identity header; blank uses shared anonymous bucket |

Use npm lockfile (`npm ci`), configure environment and a prepared PostgreSQL DB, then `npx prisma generate` and `npm run dev`. Build runs `prisma generate && next build`; start serves a built app. Build does not apply migrations. Root font uses Google font download in ordinary uncached builds.

`npm run prisma` runs **db push** then generation and can change schema outside migration history. Review target DB state and SQL before applying migrations. Current tree has a September initial migration and status, analytics, order-update, settings guarantee migrations, and the F-01?F-18 hardening migration. This review did not verify a deployed DB, apply SQL or reset data.

```sh
npm test
npm run typecheck
npm run lint
npm run build
```

On PowerShell use npm.cmd/npx.cmd if execution policy blocks .ps1 launchers.

Current verification: see [hardening deployment notes](hardening-deployment.md). The new migration was prepared, not applied. Tests mock transaction/gateway boundaries; production build/type/lint checks do not replace live PostgreSQL concurrency or browser testing.

## Adding a feature while preserving the admin structure

1. Plan model/schema migration if needed; regenerate client.
2. Add shared runtime schemas in lib/schemas and reusable domain helpers in lib.
3. Add feature actions under lib/actions with requireAdmin, full input validation, minimal returns, transaction/audit and post-commit invalidation. Prefer explicit expected-error results.
4. Add async server list/create/detail pages under app/admin/<feature>. Pass minimal data to colocated client forms/columns; await promised route props.
5. Compose DataTable/ColumnDef, dialogs, RHF shorthand fields and local Base UI controls. Include pending/error/empty/not-found behavior. Add explicit server pagination/filtering where needed.
6. Register sidebar menu data and section paths. Add badge providers only if required and decide how they refresh.
7. Revalidate actual affected routes, including detail/count consumers. Test authorization/ownership/invalid input/retries and relevant transaction invariants; check types/lint/RTL/mobile.

## Repurposing for another domain

Keep route groups, admin shell, server loaders/client forms, action boundaries, shared UI/fields, filters/pagination, access guards and transaction/audit structure. Keep tickets/settings only if useful.

| Reusable scaffold | Domain replacements |
| --- | --- |
| Sidebar/layout | Branding, menu paths/icons/sections, badges |
| Catalog CRUD | Master/SubCategory/Product models, fields, actions, forms, columns |
| Builder | SPH/CYL/axis/OD-OS, half-price rule, RAW/CUT, guarantee/packaging |
| Order workflow | Status labels/transitions, refund and daily-fee rules |
| Invoices/credit | Toman, ZarinPal, funding/debt semantics and limits |
| Profile/auth | Iranian phone/national-code schemas, store verification |
| Presentation | Persian copy, RTL/LTR, Jalali, Tehran boundaries, Arabic font |
| Integrations/assets | Bale templates, SEO, traffic-cookie name, landing MP4s, verification meta/text, support contact |

For a fresh fork, choose a deliberate migration baseline. For existing data, migrate/backfill explicitly and preserve historical snapshots/IDs. Search actions, types, helpers, forms, columns, reports and notifications for changed fields. Do not carry browser-only business checks or unfinished controls into the replacement product.

## Review scope and documentation cleanup

The review inventoried the first-party tree and inspected routes/layouts, action modules, schema/migrations, auth/domain/storage helpers, admin/customer forms, UI contracts, configuration, asset inventory, tests and docs. Depth focused on admin/forms/actions and business boundaries; static review does not mean every screen was exercised. Dependencies/generated code were not audited as app source, and secrets/live database contents were not inspected.

Obsolete bugs.md, changes.md and OrderUpdate.md were removed after their current behavior was consolidated here. They referenced missing tests, stale routes/migrations and historical verification results. Starter README is replaced with a current index. Current doc/order-management.md and docs/image-uploads.md remain. todos.txt is historical user requirements, not an authoritative status document.

## Action entry-point index

Source-derived export index at review time. An export is not proof that a control currently calls it. Read each function for its access checks and result contract.

| Action module | Exported functions |
| --- | --- |
| `lib/actions/admin.cart.actions.ts` | `ADMIN_GetOrderUserAction`, `ADMIN_AddItemToCartAction`, `ADMIN_UpdateCartItemRawOrCutAction`, `ADMIN_DeleteItemFromCartAction`, `ADMIN_ClearCartAction`, `ADMIN_SubmitCartOrderAction` |
| `lib/actions/admin.invoices.action.ts` | `ADMIN_GetInvoicesAction`, `ADMIN_GetSingleInvoiceAction`, `ADMIN_ApproveInvoiceAction`, `ADMIN_RejectInvoiceAction` |
| `lib/actions/admin.logs.action.ts` | `ADMIN_GetLogsAction` |
| `lib/actions/admin.masterCategory.actions.ts` | `ADMIN_CreateMasterCategoryAction`, `ADMIN_GetMasterCategorys`, `ADMIN_UpdateMasterCategorys`, `ADMIN_DeleteMasterCategorys` |
| `lib/actions/admin.orders.action.ts` | `ADMIN_GetOrdersAction`, `ADMIN_GetSingleOrder`, `ADMIN_UpdateOrderStatus` |
| `lib/actions/admin.productCategory.actions.ts` | `ADMIN_CreateProductCategoryAction`, `ADMIN_GetProductCategorys`, `ADMIN_UpdateProductCategorys`, `ADMIN_DeleteProductCategorys` |
| `lib/actions/admin.products.action.ts` | `ADMIN_CreateProductsAction`, `ADMIN_GetProducts`, `ADMIN_GetSingleProduct`, `ADMIN_UpdateProduct`, `ADMIN_UpdateProductCategorys`, `ADMIN_DeleteProduct` |
| `lib/actions/admin.settings.actions.ts` | `saveSettings` |
| `lib/actions/admin.summary.action.ts` | `ADMIN_GetSummaryAction`, `ADMIN_GetFinancialSummaryAction` |
| `lib/actions/admin.tag.action.ts` | `ADMIN_CreateTag`, `ADMIN_GetTags` |
| `lib/actions/admin.today-orders.action.ts` | `ADMIN_GetTodayOrdersAction`, `ADMIN_DeductDailyOrderFeeAction` |
| `lib/actions/admin.users.actions.ts` | `ADMIN_GetUsersActions`, `ADMIN_GetSingleUserAction`, `ADMIN_SearchUserAction`, `ADMIN_GetUserDetailsAction`, `ADMIN_SetUserStatusAction`, `ADMIN_AdjustUserCreditAction`, `ADMIN_UpdateUserProfileAction` |
| `lib/actions/analytics.actions.ts` | `TrackTrafficVisitAction`, `ADMIN_GetTrafficAnalyticsAction` |
| `lib/actions/auth.actions.ts` | `CreateUserAction`, `LoginAction` |
| `lib/bale.ts` (server-only, not an action) | `BALE_SendMessage` |
| `lib/actions/cart.actions.ts` | `GetUserCartItemsAction`, `AddItemToCartAction`, `UpdateCartItemRawOrCutAction`, `DeleteItemFromCartAction`, `ClearCartAction`, `SubmitCartOrderAction` |
| `lib/actions/guarantee.actions.ts` | `UpdateCartItemGuaranteeAction` |
| `lib/actions/images.action.ts` | `uploadImageAction`, `deleteImageAction` |
| `lib/actions/invoices.action.ts` | `GetInvoicesAction`, `GetSingleInvoiceAction`, `CreateInvoiceAction`, `PayInvoiceAction`, `ReconcileInvoiceAction` |
| `lib/actions/isAdmin.action.ts` | `isAdmin`, `isLoggedIn` |
| `lib/actions/orders.action.ts` | `GetOrdersAction`, `GetSingleOrder`, `MarkOrderUpdatesRead` |
| `lib/actions/productCategory.action.ts` | `GetProductCategorys`, `GetProductCategoryItems` |
| `lib/actions/products.action.ts` | `GetProductsAction` |
| `lib/actions/profile.action.ts` | `SaveProfileInfoAction` |
| `lib/actions/tags.action.ts` | `GetTags` |
| `lib/actions/tickets.action.ts` | `GetTicketsAction`, `ADMIN_GetTicketsAction`, `GetSingleTicketAction`, `ADMIN_GetSingleTicketAction`, `CreateTicketAction`, `ReplyTicketAction`, `ADMIN_ReplyTicketAction`, `CloseTicketAction`, `ADMIN_CloseTicketAction` |
