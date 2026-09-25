# Payment attempts and reconciliation

Amounts remain integer Toman in the application and are multiplied by ten for the gateway's Rial request/verify payloads. Gateway merchant ID and sandbox/live mode are now mandatory. HTTP failures/timeouts never count as payment success.

`PaymentAttempt` retains authorities and status/check timestamps. `PayInvoiceAction` authenticates the owner and limits requests. It first reconciles an existing authority. Before 15 minutes it may reuse the authority; after that it asks the provider for status. The 15 minutes is an application reuse window, not a claim about provider expiry. Only an explicit FAILED status permits replacement; unknown, IN_BANK, PAID or other states do not cause a new charge attempt. Requests are serialized by the invoice row lock. Old authorities remain available for callbacks.

The `/invoices/verify` route is deliberately exempt from the login proxy. It passes the authority to `lib/payment-recovery.ts`, which is server-only. Browser Status is not trusted; the provider must verify the exact stored amount. The route exposes no customer data and redirects to an owner-protected invoice page. Owners can also select payment reconciliation in invoice controls after a lost callback or temporary failure.

Verification records PAID/paidAt/ref ID and its audit first. A separate locked, conditional transaction applies balance credit and sets creditAppliedAt once. If the PostgreSQL Int balance has insufficient headroom, the payment remains recorded and the invoice shows credit pending; retry reconciliation after resolving balance headroom. Repeated callbacks and reconciliation never increment credit twice. A crash between receipt and credit is recoverable by reconciliation. Pending-credit cash receipts still count as cash received in financial reports; CREDIT approvals remain non-cash grants.

No automatic scheduler was added. Owners reconcile individual invoices; operators should monitor PAID CASH invoices with null creditAppliedAt and old PENDING attempts. Do not manually reset authorities or credit flags. Sandbox/live configuration must not change while attempts are unresolved.

## Provider references and verification scope

The provider documentation site was unavailable during the change. Request/response fields and endpoint paths were checked against the provider's official Android SDK:

- [HTTP routes](https://github.com/ZarinPal/Android-SDK-Kotlin/blob/main/src/main/java/com/example/zarinpal/data/remote/HttpRoutes.kt)
- [Verification request](https://github.com/ZarinPal/Android-SDK-Kotlin/blob/main/src/main/java/com/example/zarinpal/data/remote/dto/verification/PaymentVerifyRequest.kt)
- [Verification response](https://github.com/ZarinPal/Android-SDK-Kotlin/blob/main/src/main/java/com/example/zarinpal/data/remote/dto/verification/PaymentVerifyResponse.kt)
- [Inquiry request](https://github.com/ZarinPal/Android-SDK-Kotlin/blob/main/src/main/java/com/example/zarinpal/data/remote/dto/inquiry/PaymentInquiryRequest.kt) and [response](https://github.com/ZarinPal/Android-SDK-Kotlin/blob/main/src/main/java/com/example/zarinpal/data/remote/dto/inquiry/PaymentInquiryResponse.kt)

The existing 100/101 verification success interpretation is retained. Tests mock requests, duplicate callbacks and delayed credit, not the real provider. Verify merchant configuration and terminal-status semantics in a designated sandbox before release; unknown responses fail conservatively.
