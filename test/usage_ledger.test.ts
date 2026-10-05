import assert from "node:assert/strict";
import test from "node:test";
import { UsageLedger } from "../src/usage_ledger.js";

test("attributes each media stage once to the storefront customer", () => {
  const ledger = new UsageLedger();
  const ingestion = { event_id: "asset-7", customer_id: "creator-9", kind: "asset_ingested" as const, bytes: 4000 };

  assert.equal(ledger.record(ingestion).accepted, true);
  assert.equal(ledger.record(ingestion).accepted, false);
  ledger.record({ event_id: "job-7", customer_id: "creator-9", kind: "processing_completed", seconds: 31 });
  ledger.record({ event_id: "delivery-7", customer_id: "creator-9", kind: "creator_delivery", bytes: 2500 });

  assert.deepEqual(ledger.forCustomer("creator-9"), {
    customer_id: "creator-9",
    ingestion_bytes: 4000,
    processing_seconds: 31,
    delivery_bytes: 2500
  });
});
