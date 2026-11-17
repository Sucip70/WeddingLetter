# Midtrans Sandbox payment verification

## Safety and release prerequisites

- Deploy both API and web from the same tested development commit to staging.
- Do not change production keys, orders, routing, or authentication.
- Verify the running API uses `MIDTRANS_IS_PRODUCTION=false` and Sandbox keys.
- Save the Sandbox Payment Notification URL as
  `https://staging.weddingletter.id/payments/midtrans/notification`.
- Keep staging Basic Auth; its exact notification location is already public
  and the API checks notification signatures. Never disable signature checks.
- Use only https://simulator.sandbox.midtrans.com/ for simulated payment.
- Never use real funds, customer payment credentials, or manually mark orders paid.

## What changed

Status queries first preserve legacy routing, then retry a missing transaction
with `transaction-source: SNAP_API`. HTTP 200 with body `status_code=404` is a
miss, not a successful status result. Cancellation checks business status too.

The existing `payment_attempts.providerRef` stores a verified Transaction ID.
Future polls use that ID. No new database migration is required.

If no webhook has supplied the ID (notably the existing BSI example), the checkout
page displays a recovery form. Enter the **Transaction ID** copied from the
merchant's Midtrans dashboard, not the Order ID or VA number. The backend reads
Midtrans with the server key and verifies order ownership, provider Order ID,
and amount before it stores the reference or marks the order paid. A missing
webhook cannot be replaced by trusting redirect parameters.

Unknown payment status blocks method replacement; it must not create a second
payable attempt while a BI-SNAP payment might already be settled.

## Sequential live Sandbox checklist

Run each row on a separate sample order, without add-ons or personal uploads.
Use example names identifying the channel, e.g. `Test BSI` / `Sandbox`.
Do not start the next channel until its outcome is recorded.

| Sequence | Channel | Live staging verification |
| --- | --- | --- |
| 1 | BSI VA | Not run on this code revision; awaiting deployment |
| 2 | CIMB Niaga VA | Not run on this code revision; awaiting deployment |
| 3 | BNI VA | Not run on this code revision; awaiting deployment |
| 4 | BRI VA | Not run on this code revision; awaiting deployment |
| 5 | Bank Mandiri Bill Payment | Not run on this code revision; awaiting deployment |
| 6 | PermataBank VA | Not run on this code revision; awaiting deployment |
| 7 | GoPay Dynamic QRIS | Not run on this code revision; awaiting deployment |
| 8 | GoPay | Not run on this code revision; awaiting deployment |

For every row:

1. Create the sample invitation through the staging customer UI, then checkout.
2. Confirm Snap is on `app.sandbox.midtrans.com` and the page is labelled TEST.
3. Select the exact channel. If the channel is unavailable, record blocked,
   never substitute another channel and claim it passed.
4. Record the merchant order ID, provider Order ID, amount, and Transaction ID.
5. Use the corresponding VA, QRIS, or deeplink simulator to complete payment.
6. Verify Midtrans settlement AND WeddingLetter's `Pembayaran diterima` / PAID.
   A simulator success or a `transaction_status` URL parameter alone is not a pass.
7. Record automatic webhook/poll reconciliation separately from ID-assisted
   recovery; needing manual Transaction ID recovery is not an automatic-flow pass.
8. Reload checkout to confirm the state persists. Leave the invitation unpublished.
9. Save screenshots and any non-secret response codes. Never record Server Keys,
   session tokens, signature keys, or real payment details.

For GoPay, distinguish the actual `payment_type` and wallet flow from GoPay QRIS.
Snap can group/rebrand wallet and QRIS choices; record unavailable/not distinct
if the merchant configuration does not expose a separate GoPay flow.

## Local regression coverage versus live results

`src/payments/midtrans.provider.spec.ts` uses **mocked HTTP** for all eight channel
labels: legacy and BI-SNAP reads, pending/settlement/expiry, and cancellation.
Service tests cover matching order/amount, ownership, persisted references,
ID-assisted recovery, and duplicate-attempt prevention. These are NOT live
Sandbox settlement tests and do not replace the checklist above.

## Primary references

- https://docs.midtrans.com/reference/bsi-virtual-account
- https://docs.midtrans.com/reference/get-transaction-status
- https://docs.midtrans.com/reference/merchants-migration-backward-compatibality
- https://docs.midtrans.com/docs/https-notification-webhooks
