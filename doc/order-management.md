# Daily order management and history

## Pages and tabs

- `/admin` includes the daily grouped-order section above the existing summary.
- `/admin/orders` opens **مدیریت روز** (`tab=daily`) by default. This always shows today, regardless of a history date left in the URL.
- **تاریخچه سفارش ها** (`tab=history`) provides a Gregorian date input. Submit **نمایش** to load that day's orders. The date is stored as `day=YYYY-MM-DD`, so history views can be bookmarked or shared.
- Existing pending and other-order tabs remain available as `tab=submitted` and `tab=rest`, with their existing filters and pagination.
- Missing or invalid history dates fall back to today. A valid date with no orders displays an empty state.

All access and mutations require admin authorization. These management controls do not appear on customer pages.

## Grouped view

Orders are selected by creation date in the `Asia/Tehran` business timezone, using an inclusive midnight start and exclusive next-day midnight end. Every status is included initially, including pending and rejected/on-hold orders. Groups are not split across pages: dailyPage paginates 20 whole user groups, and fee receipts are scoped to those users.

Each user has one collapsible group, initially closed. Its summary shows username, store name when available, **current** credit balance, matching order count and matching order total. The username links to the admin user page. The details button supports keyboard navigation and exposes expanded state through Base UI Collapsible.

Expanding reveals order numbers, Tehran timestamps, row/lens counts, totals, existing delivery charges, status controls, notes and links to full order management. Closing a group preserves its mounted form state. Changing the selected date resets the groups and filters.

The user dropdown contains only users on the current page with orders on the selected day. Status filtering does not remove users from that dropdown. User and status filters apply together; group counts and totals reflect matching orders. Clearing filters restores all orders for the displayed user page. Refresh loads current server data.

Order statuses and credit balances are current values, even when browsing historical order dates; this is not an archived financial snapshot. Historical orders can still be managed through the status controls and detail links.

## Number and date display

Grouped order counts, balances, amounts and fee receipts use Latin digits with English thousands separators, for example `1,250`. Persian labels and the Persian calendar remain; displayed dates and times use `fa-IR-u-nu-latn` for Latin digits. The history date input uses the browser's native Gregorian date control. The dashboard summary numbers also use Latin digits. New customer fee messages follow the same convention; existing saved messages are not rewritten.

## Daily fees

On today's groups, admins can deduct either the configured delivery price or a positive integer custom amount with a customer-visible reason. This is an additional fee for the user's whole daily group, independent of status filters and separate from delivery charges already stored on individual orders.

- The delivery option uses `Setting.deliveryPrice` and can be applied only once per user per Tehran day.
- Custom fees require a reason of 3–300 characters. Amounts must fit the database integer limit and the user's available credit.
- A transaction locks the user account, checks the expected balance, deducts the amount, writes an audit receipt and creates a customer-visible update on the user's latest order that day.
- Delivery receipts use a deterministic user/day key. Custom requests use a request UUID to prevent repeated deductions when retrying the same request.
- Changed balances, changed delivery settings, a stale day or missing daily orders reject the deduction. A zero delivery setting cannot be charged; select a custom amount or update settings.
- Customers see the reduced balance and an explanatory order-history message. These fees do not change original order totals or the original order's refundable credit amount.
- Past/future history views show fee receipts but do not offer new deductions. Selecting today in history offers the same controls as daily management.

No schema change or migration is required. Existing `User`, `Setting`, `AuditLog` and `OrderUpdate` records are used. Audit receipts are part of duplicate-charge protection and must not be removed as disposable logs.

## Implementation

- `lib/actions/admin.today-orders.action.ts`: authorized date-scoped query and fee action. `ADMIN_GetTodayOrdersAction(rawDay?, page?)` accepts an optional Gregorian day and user-group page and returns `isToday` with the orders and fee receipts.
- `lib/todays-orders.ts`: client-safe grouping and user-dropdown helpers.
- `components/core/TodaysOrdersSection.tsx`: shared server loader for the dashboard and both grouped tabs.
- `components/core/TodaysOrders.tsx`: filters, summaries, collapsible groups and status management.
- `components/core/DailyOrderFee.tsx`: delivery/custom deduction form.
- `lib/daily-order-charge.ts`: validation, transaction logic and duplicate protection.
- `tests/todays-orders.test.cjs`: grouping, status inclusion, Tehran date boundaries, duplicate fees, invalid amounts and stale balances using mocked transaction methods.

Validation commands:

```sh
node --test tests/todays-orders.test.cjs
npm run typecheck
```

The tests do not exercise a live database or browser. Manual verification should cover keyboard expansion, collapsed defaults, tab navigation, a date with no orders, a historical date, Latin digits and fee controls appearing only for today. Verify real fee deductions only with a designated test account.

## Checkout and history policy (2026-09-25)

Delivery remains in this daily-fee workflow; new checkout rejects nonzero per-order delivery fees. Cutting fees remain disabled. Existing historical per-order fees are not rewritten. A refunded order cannot leave ONHOLD; place a new charged order instead. CREDIT PAID is a balance grant, not a cash receipt.

New order items snapshot product name/category/color/packaging. Old null snapshots retain current-catalog fallback. Order-detail items/updates paginate at 50 rows; totals and lens counts remain full-order aggregates. Pending badges poll the shared database every 15 seconds, including after status changes. Only the active `/admin/orders` tab loads its data.

The daily-fee feature itself uses existing models, but the broader F-01?F-18 release requires the [hardening migration](../docs/hardening-deployment.md).
