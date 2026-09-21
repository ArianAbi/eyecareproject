# Browser test report

Tested on 2026-09-21 against `http://localhost:3000` with headless Chrome 153 at 1440×1000 and 390×844. The supplied `arian` account was used for authentication. The password is intentionally omitted from this report.

## Test data created

Two active lens products were created through `/admin/products/create`, using the existing `SEE MAX` product category:

- `تست عدسی روزانه 141155` — 450,000 تومان
- `تست عدسی بلوکات 141155` — 625,000 تومان

Both products appeared in the admin products table after submission. Screenshot: [06-products-after-create.png](./06-products-after-create.png).

## Results

| Test | Result | Evidence |
| --- | --- | --- |
| Admin login with `arian` | Pass | [01-login.png](./01-login.png) |
| Existing master and product categories load | Pass | [04-master-categories.png](./04-master-categories.png), [05-product-categories.png](./05-product-categories.png) |
| Create two lens products from the admin form | Pass | [03-create-product.png](./03-create-product.png), [06-products-after-create.png](./06-products-after-create.png) |
| Admin dashboard loads | Pass | [07-admin-dashboard.png](./07-admin-dashboard.png) |
| Admin users page loads | Pass | [08-admin-users.png](./08-admin-users.png) |
| Traffic analytics page loads | Pass | [09-admin-analytics.png](./09-admin-analytics.png) |
| Admin order-for-user page loads | Pass | [10-admin-order-for-user.png](./10-admin-order-for-user.png) |
| Admin user search selects `arian` and loads that user's order builder | Pass | [10b-admin-order-user-selected.png](./10b-admin-order-user-selected.png) |
| Customer glass-lens order page loads on desktop | Pass | [11-user-order-desktop.png](./11-user-order-desktop.png) |
| Customer glass-lens order page fits a 390 px mobile viewport | Pass | [12-user-order-mobile.png](./12-user-order-mobile.png) |
| Mobile cart table has local horizontal scrolling | Pass | The 600 px table is inside a 354 px container with `overflow-x: auto`; document width remains 390 px. |

No tested route displayed an application error. The tested routes were `/admin`, `/admin/users`, `/admin/analytics`, `/admin/glasslens-order`, and `/glasslens-order`.

## Findings

1. **Traffic pie chart renders as a partial circle with one source.** The analytics page has two direct/unknown visits, but the single-source pie appears as a large partial sector instead of a complete circle. See [09-admin-analytics.png](./09-admin-analytics.png).

2. **Dashboard zero values resemble small dots.** The three summary cards show a small white mark where a numeric zero is expected. See [07-admin-dashboard.png](./07-admin-dashboard.png).

3. **The admin account has no credit.** The selected-user order builder correctly disables final submission and displays zero credit. Product creation and page rendering were tested, but a paid order was not submitted because that would require changing account credit.

4. **Mobile layout behaves as intended.** The prescription controls, cart, and order summary stack vertically. The page itself does not overflow horizontally, and the cart table owns its horizontal scroll area.

## Artifacts

The PNG files in this folder are the captured screenshots. `run-summary.json` contains route and viewport measurements. The repeatable Chrome DevTools Protocol runner is in `browser-test.mjs`; pass `--no-create` to avoid creating additional products during another run.
