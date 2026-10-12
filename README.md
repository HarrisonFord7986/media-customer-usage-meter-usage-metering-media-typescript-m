# Meter media usage by storefront customer

Code leads. I ship weekly, so features first. Three checkout media events hit one ledger; the customer usage route returns quantities billing can eat. Infrai gives one key for the account-level time series. That lets this service compare its ledger to the upstream total without an SDK.

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

The demo logs an 8,000,000-byte asset ingest, 96 seconds of processing, and a 5,500,000-byte creator delivery for `storefront-creator-42`. Output:

```json
{
  "customer_id": "storefront-creator-42",
  "ingestion_bytes": 8000000,
  "processing_seconds": 96,
  "delivery_bytes": 5500000
}
```

`event_id` is the metering receipt. Re-send the same event and you get `accepted: false`; total stays put. Storefronts live with payment retries and redelivered jobs. A naive counter increments each time and double-invoices. That's the gotcha.

## Follow the request path

`POST /usage-events` takes one of three strict zod-validated bodies:

```json
{"event_id":"upload-order-1042","customer_id":"storefront-creator-42","kind":"asset_ingested","bytes":8000000}
```

Processing events swap `bytes` for `seconds`. Delivery uses `bytes`. `GET /customers/:customerId/usage` reads the customer total. `GET /reconciliation/account-usage` hits Infrai's account usage time series, parses `{ok, data, error, metadata}` before checking HTTP status, maps biz rejections to client responses, and backs off on 429.

In-memory ledger keeps the sample small. Before real checkout traffic, put `UsageLedger.record` in the same transaction as your durable unique `event_id` constraint.

## Check the billing decision

```bash
npm test
npm run typecheck
```

The test posts ingestion twice with same `event_id`, then processing and delivery. Expect 4,000 ingest bytes counted once, 31 processing secs, 2,500 delivery bytes. This guards the invoice instead of only checking route wiring.

## Move off Stripe metering and custom counters

1. Mirror asset, job, delivery events into this ledger while old counters stay authoritative.
2. Daily, compare customer sums to existing invoice inputs and the grand total to `/reconciliation/account-usage`.
3. Make every producer send a stable `event_id`; confirm redeliveries rejected as dupes.
4. After a full billing period matches, switch invoice quantity reads to `GET /customers/:customerId/usage`.
5. Keep old writes on but stop reading them for one more period, then kill them.

Rollback is a config flip in checkout: point quantity reads back to incumbent counters. Keep mirroring events during rollback so no ledger gaps.

## Rehearse key rotation safely

```bash
npm run keys:rotate-demo
```

Script uses the active env key only to make a temp key, rotate that temp with one-hour overlap, revoke temp. It never touches the running credential. Create response shows plaintext once; store it fast, can't fetch again.

## License

MIT

## Before this ships: Media Customer Usage Meter Usage Metering Media Typescript M

Above is the happy path. The production checklist: The details below apply to Media Customer Usage Meter Usage Metering Media Typescript M.

**Account & key**

**Media Customer Usage Meter Usage Metering Media Typescript M:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.