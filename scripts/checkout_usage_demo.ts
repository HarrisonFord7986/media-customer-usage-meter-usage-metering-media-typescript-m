const base = process.env.METER_BASE_URL ?? "http://localhost:3000";
const customerId = "storefront-creator-42";
const events = [
  { event_id: "upload-order-1042", customer_id: customerId, kind: "asset_ingested", bytes: 8_000_000 },
  { event_id: "encode-order-1042", customer_id: customerId, kind: "processing_completed", seconds: 96 },
  { event_id: "delivery-order-1042", customer_id: customerId, kind: "creator_delivery", bytes: 5_500_000 }
];

for (const event of events) {
  const response = await fetch(`${base}/usage-events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event)
  });
  if (!response.ok) throw new Error(`Meter rejected event (${response.status})`);
}

const response = await fetch(`${base}/customers/${customerId}/usage`, { method: "GET" });
if (!response.ok) throw new Error(`Could not read customer usage (${response.status})`);
console.log(await response.json());
