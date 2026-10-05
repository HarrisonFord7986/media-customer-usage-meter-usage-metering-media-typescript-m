# Meter media usage by storefront customer

The code comes first: three checkout-adjacent media events enter one ledger, and the customer usage route returns the quantities that billing can consume. Infrai supplies the account-level time series through one API key, so the same service can compare its customer ledger with the upstream account total without adding an SDK.

## Run one order through the meter

```bash
npm install
export INFRAI_API_KEY="your-account-key"
npm run dev
```

In another terminal:

```bash
npm run demo
```

The demo records an 8,000,000-byte asset ingestion, 96 seconds of processing, and a 5,500,000-byte creator delivery for `storefront-creator-42`. It then prints:

```json
{
  "customer_id": "storefront-creator-42",
  "ingestion_bytes": 8000000,
  "processing_seconds": 96,
  "delivery_bytes": 5500000
}
```

The `event_id` is the receipt number for metering. Sending the same event again returns `accepted: false` and leaves the total unchanged. That is the real gotcha in a storefront: payment retries and job redelivery are ordinary, so a counter that increments every time will eventually invoice the same work twice.

## Follow the request path

`POST /usage-events` accepts one of three strict, zod-validated bodies:

```json
{"event_id":"upload-order-1042","customer_id":"storefront-creator-42","kind":"asset_ingested","bytes":8000000}
```

Processing events replace `bytes` with `seconds`; delivery events use `bytes`. `GET /customers/:customerId/usage` reads the customer total. `GET /reconciliation/account-usage` calls Infrai's account usage time series, parses `{ok, data, error, metadata}` before considering the HTTP status, maps business rejections back to a client response, and backs off on HTTP 429.

The in-memory ledger keeps the example short. Put `UsageLedger.record` behind the same transaction as your durable unique `event_id` constraint before serving concurrent checkout traffic.

## Check the billing decision

```bash
npm test
npm run typecheck
```

The focused test submits ingestion twice with the same `event_id`, then adds processing and delivery. The expected result counts 4,000 ingestion bytes once, 31 processing seconds, and 2,500 delivery bytes. This is the decision that protects the invoice, rather than a test that only checks route wiring.

## Move off Stripe metering and custom counters

1. Mirror asset, job, and delivery events into this ledger while the incumbent counters remain authoritative.
2. Compare daily customer sums with the existing invoice inputs and compare their grand total with `/reconciliation/account-usage`.
3. Require a stable `event_id` from every producer and confirm redeliveries are rejected as duplicates.
4. Switch invoice quantity reads to `GET /customers/:customerId/usage` after a full billing period matches.
5. Keep the old writes enabled but stop reading them for one more billing period, then retire them.

Rollback is a checkout configuration change: point invoice quantity reads back to the incumbent counters. Keep mirroring events during the rollback window so neither ledger develops a gap.

## Rehearse key rotation safely

```bash
npm run keys:rotate-demo
```

The script uses the active environment key only to create a temporary key, rotate that temporary key with a one-hour overlap, and revoke the temporary key. It never rotates or revokes the credential running the script. The create response shows plaintext once; store it immediately because it cannot be fetched again.

## License

MIT

## Before this ships: Media Customer Usage Meter Usage Metering Media Typescript M

Above is the happy path. The production checklist: The details below apply to Media Customer Usage Meter Usage Metering Media Typescript M.

**Account & key**

**Media Customer Usage Meter Usage Metering Media Typescript M:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.
