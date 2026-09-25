# F-01?F-18 deployment and verification

Implemented 2026-09-25. This change has not been deployed and no existing database was migrated by the coding agent.

## Migration and configuration

1. Back up the database and upload directory. Review `prisma/migrations/20260925120000_findings_hardening/migration.sql` and replay migrations on a disposable PostgreSQL database first.
2. Apply through your normal deployment: `npx prisma migrate deploy`, then `npx prisma generate`. Do not use db push as a migration substitute.
3. Deploy code and schema together: RateLimit, ImageAsset and PaymentAttempt are required by runtime paths. The migration also adds OrderItem.productSnapshot and Invoice.creditAppliedAt, seeds existing authorities and marks existing PAID invoices as already credited.
4. Set a real `ZARINPAL_MERCHANT_ID`, explicit `ZARINPAL_SANDBOX=true|false`, and the correct `APP_URL`. Never switch sandbox/live mode with unresolved attempts; reconcile those attempts first. No real gateway transactions were performed during this work.
5. Set `IMAGE_UPLOAD_DIR` to persistent storage. Every instance must mount the same directory; local ephemeral disks are unsupported. Existing files need reviewed owner mappings in ImageAsset before access; do not guess ownership. Back up files and metadata together.
6. Set `RATE_LIMIT_IP_HEADER` only to a header your ingress overwrites, and prevent direct clients from bypassing that ingress. Without it, anonymous traffic shares a conservative global bucket. Host/WAF limits were not inspected.

## Application limits

| Operation | Limit/window |
| --- | --- |
| Login, request identity | 30 / 15 minutes |
| Login, normalized account | 10 / 15 minutes |
| Signup, request identity | 5 / hour |
| Upload, account | 10 / hour; 100 files and 100 MiB stored |
| Analytics, request identity | 30 / minute |
| New ticket, account | 5 / hour |
| Ticket reply, account | 30 / minute |
| Payment start/reconcile, account | 10 / minute per operation |
| Payment callback, request identity | 60 / minute |

Fixed-window limits can allow a burst at a window boundary. Database counters are shared across workers and fail closed on database failure. They are application safeguards, not a replacement for ingress request/body/connection limits.

## Verification

Run `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build`. Tests include direct action invocation, mocked transactions, eligibility tables, profile output/state, catalog relationship checks, safe error serialization, notification failures, polling authorization, payment retry/overflow and private upload access/quota. Existing Sharp tests use real image processing.

Local results on 2026-09-25: 34 tests passed; TypeScript and Prisma schema validation passed; lint passed with existing unused-code warnings; production build passed. A local production HTTP signup action with deliberately invalid input returned a readable failure/fieldErrors payload without DB writes. The production action manifest contains no BALE_SendMessage export. Local smoke testing used a process-scoped trusted localhost host setting and both test servers were stopped.

The initial build exposed a missing default export in the installed Lucide TowelRack module; first-party icon imports now use RectangleHorizontal for the cloth indicator without inspecting/modifying dependencies. Build output also contained existing dynamic-render diagnostics and a PostgreSQL SSL-mode deprecation warning; compilation/page generation completed successfully. Tests do not prove PostgreSQL lock/isolation behavior, live provider behavior, authenticated production action behavior or browser/RTL interactions. The HTTP smoke test covers invalid signup only. Perform those checks against disposable/sandbox resources before release. This work did not read or modify node_modules source.

## Operational policies

- Delivery is charged only through the existing daily-fee workflow; cutting fees are disabled. Telegram settings are inactive. Bale delivery is awaited best effort with timeout and safe failure logging; there is no durable outbox.
- A refunded order stays ONHOLD. Place a new paid order to resume fulfillment.
- New product descriptions used in order history are snapshots; old items without snapshots retain live-catalog fallback.
- Pending order badges poll the DB every 15 seconds. `/api/orders/order-stream` is now JSON, not SSE; other consumers must update accordingly.
- Daily group pagination keeps whole users together; local filters apply only to the current 20-user page. A single unusually large user group can still be expensive.
- Use `/profile/uploads` to remove unused owned assets. Review `node scripts/cleanup-orphan-images.cjs` output before an operator runs it with `--apply`. The script only targets UUID WebP files older than 24 hours with no ImageAsset record, up to 1000 per run. Review legacy ownership first.
