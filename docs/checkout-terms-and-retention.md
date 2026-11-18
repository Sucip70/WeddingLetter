# Checkout agreement and paid-draft retention

Implemented 18 November 2026. Review legal wording before public release.

## Customer and admin surfaces

- `/syarat-ketentuan` and `/kebijakan-privasi` are public; links are in the footer.
- New-order and extension checkout require an unchecked-by-default checkbox.
- Policy links open separately, preserving editor input. No marketing opt-in is bundled.
- `/admin/settings` controls owner name/profile link, support contact/hours, response target and draft retention (default 100 days).
- `/checkout/:orderId/terms` shows the exact stored terms to the authenticated owner, not the latest mutable public document.
- Admin order detail includes agreement time, version, original owner identity and full policy copy.

## Migration and deployment

Run the normal Prisma deployment migrations before starting the new API:

```sh
npm run prisma:generate --workspace apps/api
cd apps/api
npx prisma migrate deploy
```

Migration `20261118010000_checkout_terms_and_draft_retention` adds nullable order fields only. Existing orders are not opted in and are not assigned a deadline. Never backfill paid historical orders without a separately approved customer transition plan.

## Acceptance and immutable rules

`termsAccepted: true` and the current `termsVersion` are required by the service, for both new and extension orders. Quotes remain usable before consent. Stale or omitted versions are rejected before order creation. The version is a revision plus content hash covering the complete policy and business settings.

Orders store server-generated acceptance time, version, full JSON policy copy and retention duration. The existing order/user foreign key identifies the accepting account. Admin setting changes only affect subsequent orders. Never rewrite old snapshots.

On the first successful payment, a new order receives `draftExpiresAt = paidAt + purchased retention duration`. Repeated payment callbacks do not move the deadline. Extensions and legacy orders have no draft deadline.

## Maintenance and safety

The hourly maintenance task sends email reminders at H-14 and H-3. When first processed within H-3, only the urgent reminder is sent. Reminder claims are atomic; failed delivery resets the claim for retry. Configure Resend before relying on delivery.

Expired paid, never-published drafts are logically deleted; content and guest records are cleared. Media objects are removed separately, with retries if storage is unavailable. Publication and cleanup use conditional database claims so cleanup cannot remove a concurrently published invitation. Payment records and consent snapshots are retained.

Do not confuse this deadline with the existing 30-day grace period after an active invitation expires. Old drafts without a deadline remain excluded. `DISABLE_JOBS=true` disables scheduled maintenance during local review.

## Refunds

New-template full refunds retain the existing 48-hour / never-published eligibility rule. The policy describes a manual support review for unused extensions/add-ons requested within 48 hours; this is not an automatic prorated refund or automatic reversal of an applied extension. Duplicate payments, service failures and statutory rights are explicitly excluded from ordinary change-of-mind restrictions.

## Verification

Run web/API Vitest suites and TypeScript checks. The opt-in database integration test uses isolated local fixtures only:

```powershell
$env:TERMS_DB_TESTS='1'
npm.cmd run test --workspace apps/api -- src/orders/terms.integration.spec.ts
```

Local review captures are in `output/review/checkout-terms-2026-11-18/` (not committed).
